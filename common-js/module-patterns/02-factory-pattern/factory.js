function factory(a) {
    var MyClass = function(a) {
        this.a = a;
        return this.a;
    }
    return new MyClass(a);
}
module.exports = factory;

