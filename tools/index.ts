import {Dexie, IndexableType, Table} from "dexie";

type JSTypeName = String | Number | Boolean | Object | Symbol | BigInteger;

export default function createDBClass<T extends Record<string, JSTypeName>>(name: string, properties: T) {
  const key = Symbol(name);
  type PropertyType<K extends keyof typeof properties> = typeof properties[K] extends new (...args: unknown[]) => infer R ? R : never
  type Properties = {
    [K in keyof typeof properties]: PropertyType<K>;
  };

  return class extends Dexie {
    [key]!: Table<Properties>;
    constructor() {
      super(name);
      this.version(1).stores({
        [key]: `++id, ${Object.keys(properties).join(', ')}`
      })
    }

    async getField(filedKey: keyof typeof properties, value: PropertyType<typeof filedKey>) {
      if (!this[key]) throw new Error(`${name} not ready`);
      return this[key].where(filedKey as string).equals(value as IndexableType).toArray();
    }

    async deleteField(filedKey: keyof typeof properties, value: PropertyType<typeof filedKey>) {
      if (!this[key]) throw new Error(`${name} not ready`);
      await this[key].where(filedKey as string).equals(value as IndexableType).delete();
    }

    async add(fields: Properties) {
      if (!this[key]) throw new Error(`${name} not ready`);
      await this[key].add(fields);
    }

    async update(filedKey: keyof typeof properties, value: PropertyType<typeof filedKey>, newProperties: Properties) {
      if (!this[key]) throw new Error(`${name} not ready`);
      const fields = await this[key].where(filedKey as string).equals(value as IndexableType).toArray();
      const [oldField] = fields;
      this[key].update(oldField, {
        ...oldField,
        ...newProperties
      })
    }

    async getAll() {
      if (!this[key]) throw new Error(`${name} not ready`);
      return this[key].toArray();
    }

    async deleteAll() {
      if (!this[key]) throw new Error(`${name} not ready`);
      return this[key].clear();
    }
  }
}


// for example
// const DB = createDBClass('field', {
//   a: String,
//   b: Number
// })
//
// const db = new DB();
//
// db.add({
//   a: '2',
//   b: 2
// })