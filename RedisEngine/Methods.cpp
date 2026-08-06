#include <iostream>
#include <unordered_map>
#include <list>
#include <memory>
#include <string>
#include <sstream>

using namespace std;

class IEvictionPolicy {
public:
    virtual void onGet(const string &key) = 0;
    virtual void onPut(const string &key) = 0;
    virtual string evict() = 0;
    virtual string getStateAsJson() = 0; 
    virtual ~IEvictionPolicy() = default;
};

class LRU : public IEvictionPolicy {
private:
    list<string> usageOrder;
    unordered_map<string, list<string>::iterator> position;

public:
    void onGet(const string &key) override {
        auto it = position.find(key);
        if (it == position.end()) return;
        usageOrder.erase(it->second);
        usageOrder.push_front(key);
        position[key] = usageOrder.begin();
    }
    void onPut(const string &key) override {
        if (position.find(key) != position.end()) {
            onGet(key);
            return;
        }
        usageOrder.push_front(key);
        position[key] = usageOrder.begin();
    }
    string evict() override {
        if (usageOrder.empty()) return "";
        string popper = usageOrder.back();
        usageOrder.pop_back();
        position.erase(popper);
        return popper;
    }
    string getStateAsJson() override {
        // Formats the LRU queue into a JSON array string: ["key1", "key2"]
        stringstream ss;
        ss << "[";
        bool first = true;
        for (const auto& key : usageOrder) {
            if (!first) ss << ",";
            ss << "\"" << key << "\"";
            first = false;
        }
        ss << "]";
        return ss.str();
    }
};

class LFU : public IEvictionPolicy {
private:
    unordered_map<string, int> freq;
    unordered_map<int, list<string>> fList;
    unordered_map<string, list<string>::iterator> position;
    int minFrequency = 1;

public:
    void onGet(const string &key) override {
        if (freq.find(key) == freq.end()) return;
        int oldFreq = freq[key];
        freq[key]++;
        fList[oldFreq].erase(position[key]);
        if (fList[oldFreq].empty()) {
            fList.erase(oldFreq);
            if (minFrequency == oldFreq) minFrequency++;
        }
        fList[freq[key]].push_back(key);
        position[key] = prev(fList[freq[key]].end());
    }
    void onPut(const string &key) override {
        if (freq.find(key) != freq.end()) {
            onGet(key);
            return;
        }
        freq[key] = 1;
        fList[1].push_back(key);
        position[key] = prev(fList[1].end());
        minFrequency = 1;
    }
    string evict() override {
        if (fList[minFrequency].empty()) return "";
        string victim = fList[minFrequency].front();
        fList[minFrequency].pop_front();
        freq.erase(victim);
        position.erase(victim);
        if (fList[minFrequency].empty()) {
            fList.erase(minFrequency);
        }
        return victim;
    }
    string getStateAsJson() override {
        // Formats frequencies: {"1":["A"],"2":["B"]}
        stringstream ss;
        ss << "{";
        bool firstFreq = true;
        for (const auto& pair : fList) {
            if (!firstFreq) ss << ",";
            ss << "\"" << pair.first << "\":[";
            bool firstKey = true;
            for (const auto& key : pair.second) {
                if (!firstKey) ss << ",";
                ss << "\"" << key << "\"";
                firstKey = false;
            }
            ss << "]";
            firstFreq = false;
        }
        ss << "}";
        return ss.str();
    }
};

class FIFO : public IEvictionPolicy {
private:
    list<string> usageOrder;
    unordered_map<string, list<string>::iterator> position;

public:
    void onGet(const string &key) override { return; }
    void onPut(const string &key) override {
        if (position.find(key) != position.end()) return;
        usageOrder.push_back(key);
        position[key] = prev(usageOrder.end());
    }
    string evict() override {
        if (usageOrder.empty()) return "";
        string popper = usageOrder.front();
        usageOrder.pop_front();
        position.erase(popper);
        return popper;
    }
    string getStateAsJson() override {
        stringstream ss;
        ss << "[";
        bool first = true;
        for (const auto& key : usageOrder) {
            if (!first) ss << ",";
            ss << "\"" << key << "\"";
            first = false;
        }
        ss << "]";
        return ss.str();
    }
};

class Cache {
private:
    unordered_map<string, string> cache;
    unique_ptr<IEvictionPolicy> policy;
    int capacity;

public:
    Cache(int cap, unique_ptr<IEvictionPolicy> p)
        : capacity(cap), policy(move(p)) {}

    void changePolicy(unique_ptr<IEvictionPolicy> newPolicy) {
        policy = move(newPolicy);
        cache.clear(); // Wipe cache on policy toggle
    }

    string put(string key, string value) {
        string status = "INSERTED";
        if (cache.find(key) != cache.end()) {
            cache[key] = value;
            policy->onPut(key);
            return "UPDATED";
        }
        if (cache.size() == capacity) {
            string victim = policy->evict();
            cache.erase(victim);
            status = "EVICTED_" + victim;
        }
        cache[key] = value;
        policy->onPut(key);
        return status;
    }

    string get(string key) {
        auto it = cache.find(key);
        if (it == cache.end()) return "MISS";
        policy->onGet(key);
        return "HIT_" + it->second;
    }

    string getFullStateJson(const string& lastOp, const string& opStatus) {
        stringstream ss;
        ss << "{";
        ss << "\"lastOperation\":\"" << lastOp << "\",";
        ss << "\"status\":\"" << opStatus << "\",";
        
        // Items in cache map
        ss << "\"kvStore\":{";
        bool first = true;
        for (const auto& pair : cache) {
            if (!first) ss << ",";
            ss << "\"" << pair.first << "\":\"" << pair.second << "\"";
            first = false;
        }
        ss << "},";
        
        // Policy internal structure
        ss << "\"policyState\":" << policy->getStateAsJson();
        ss << "}";
        return ss.str();
    }
};

// --- IPC Driver Main Loop ---
int main() {
    // Default: LRU Cache with capacity of 4
    int capacity = 4;
    unique_ptr<Cache> cacheSystem = make_unique<Cache>(capacity, make_unique<LRU>());

    string command;
    // Keep thread open, listening for raw strings from Node.js
    while (cin >> command) {
        if (command == "PUT") {
            string key, val;
            cin >> key >> val;
            string status = cacheSystem->put(key, val);
            // Write a single compact line of JSON to stdout terminated by a newline
            cout << cacheSystem->getFullStateJson("PUT", status) << endl;
        } 
        else if (command == "GET") {
            string key;
            cin >> key;
            string status = cacheSystem->get(key);
            cout << cacheSystem->getFullStateJson("GET", status) << endl;
        }
        else if (command == "POLICY") {
            string type;
            cin >> type;
            if (type == "LRU") cacheSystem->changePolicy(make_unique<LRU>());
            else if (type == "LFU") cacheSystem->changePolicy(make_unique<LFU>());
            else if (type == "FIFO") cacheSystem->changePolicy(make_unique<FIFO>());
            cout << cacheSystem->getFullStateJson("POLICY_CHANGE", "SUCCESS") << endl;
        }
    }
    return 0;
}
