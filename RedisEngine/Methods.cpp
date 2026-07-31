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
        string popper = usageOrder.back();
        usageOrder.pop_back();
        position.erase(popper);
        return popper;
    }
};

// class LFU : public IEvictionPolicy
// {
// private:
//     list<string> usageOrder;
//     unordered_map<string, list<string>::iterator> position;

// public:
//     void onGet(const string &key) override
//     {
//         auto it = position.find(key);

//         if (it == position.end())
//             return;
//         usageOrder.erase(it->second);
//         usageOrder.push_back(key);
//         position[key] = usageOrder.end();
//     }
//     void onPut(const string &key) override
//     {
//         if (position.find(key) != position.end())
//         {
//             onGet(key);
//             return;
//         }
//         usageOrder.push_front(key);
//         position[key] = usageOrder.begin();
//     }
//     string evict() override
//     {
//         string popper = usageOrder.front();
//         usageOrder.pop_front();
//         position.erase(popper);
//         return popper;
//     }
// };

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

    void put(string key, string value);
    string get(string key);
};