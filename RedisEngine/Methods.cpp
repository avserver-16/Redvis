#include <iostream>
#include <unordered_map>
#include <list>
#include <memory>
#include <string>

using namespace std;

class IEvictionPolicy
{
public:
    virtual void onGet(const string &key) = 0;
    virtual void onPut(const string &key) = 0;
    virtual string evict() = 0;
    virtual ~IEvictionPolicy() = default;
};

class LRU : public IEvictionPolicy
{
private:
    list<string> usageOrder;
    unordered_map<string, list<string>::iterator> position;

public:
    void onGet(const string &key) override
    {
        auto it = position.find(key);

        if (it == position.end())
            return;

        usageOrder.erase(it->second);
        usageOrder.push_front(key);
        position[key] = usageOrder.begin();
    }
    void onPut(const string &key) override
    {
        if (position.find(key) != position.end())
        {
            onGet(key);
            return;
        }
        usageOrder.push_front(key);
        position[key] = usageOrder.begin();
    }
    string evict() override
    {
        if (usageOrder.empty())
            return "";
        string popper = usageOrder.back();
        usageOrder.pop_back();
        position.erase(popper);
        return popper;
    }
};

class LFU : public IEvictionPolicy
{
private:
    unordered_map<string, int> freq;
    unordered_map<int, list<string>> fList;
    unordered_map<string, list<string>::iterator> position;
    int minFrequency = 1;

public:
    void onGet(const string &key) override
    {
        if (freq.find(key) == freq.end())
        {
            return;
        }
        int oldFreq = freq[key];
        freq[key]++;
        fList[oldFreq].erase(position[key]);
        if (fList[oldFreq].empty())
        {
            fList.erase(oldFreq);

            if (minFrequency == oldFreq)
                minFrequency++;
        }
        fList[freq[key]].push_back(key);
        position[key] = prev(fList[freq[key]].end());
    }
    void onPut(const string &key) override
    {
        if (freq.find(key) != freq.end())
        {
            onGet(key);
            return;
        }

        freq[key] = 1;
        fList[1].push_back(key);
        position[key] = prev(fList[1].end());
        minFrequency = 1;
    }

    string evict() override
    {
        string victim = fList[minFrequency].front();
        fList[minFrequency].pop_front();
        freq.erase(victim);
        position.erase(victim);
        if (fList[minFrequency].empty())
        {
            fList.erase(minFrequency);
        }
        return victim;
    }
};

class FIFO : public IEvictionPolicy
{
private:
    list<string> usageOrder;
    unordered_map<string, list<string>::iterator> position;

public:
    void onGet(const string &key) override
    {
        return;
    }
    void onPut(const string &key) override
    {
        if (position.find(key) != position.end())
        {
            return;
        }
        usageOrder.push_back(key);
        position[key] = prev(usageOrder.end());
    }
    string evict() override
    {
        if (usageOrder.empty())
            return "";
        string popper = usageOrder.front();
        usageOrder.pop_front();
        position.erase(popper);
        return popper;
    }
};

class Cache
{
private:
    unordered_map<string, string> cache;
    unique_ptr<IEvictionPolicy> policy;
    int capacity;

public:
    Cache(int cap, unique_ptr<IEvictionPolicy> p)
        : capacity(cap), policy(move(p)) {}

    void put(string key, string value)
    {
        if (cache.find(key) != cache.end())
        {
            cache[key] = value;
            policy->onPut(key);
            return;
        }

        if (cache.size() == capacity)
        {
            string victim = policy->evict();
            cache.erase(victim);
        }

        cache[key] = value;
        policy->onPut(key);
    }

    string get(string key)
    {
        auto it = cache.find(key);

        if (it == cache.end())
            return "NOT FOUND";

        policy->onGet(key);

        return it->second;
    }
};

