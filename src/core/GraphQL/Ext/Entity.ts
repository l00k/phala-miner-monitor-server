type ClassConstructor<T> = new(...args : any[]) => T;

export default function Entity<T>(entityName : string) {
    return (Target : ClassConstructor<T>) => {
        Object.defineProperty(Target.prototype, '_fullname', {
            get() { return entityName; }
        });
    };
}
