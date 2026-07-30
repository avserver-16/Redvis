#include <iostream>
#include <unordered_map>
#include <vector>
#include <string>
#include <memory>
using namespace std;

class IExcecutionPolicy
{
public:
    virtual void onGet(const std::string &key) const = 0;
    virtual void onPut(const std::string &key) const = 0;
    virtual std::string evict() = 0;
    virtual ~IExcecutionPolicy() = default;
};

class LRU : public IExcecutionPolicy
{
};
class LFU : public IExcecutionPolicy
{
};
class FIFO : public IExcecutionPolicy
{
};

class Cache
{
private:
    unordered_map<std::string, std::string> cache;
    unique_ptr<IExcecutionPolicy> policy;
    int capacity;

public:
    Cache(int cap, unique_ptr<IExcecutionPolicy> p)
        : capacity(cap), policy(std::move(p)) {}

    void put(string key, string value);
    string get(string key);
};
