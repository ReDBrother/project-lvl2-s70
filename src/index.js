import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import getParser from './parsers';
import getFormatter from './formatters';

export const unchanged = 'uncahnged';
export const changed = 'changed';
export const added = 'added';
export const deleted = 'removed';
export const object = 'object';

const compareTwoConfigurations = (firstConfig, secondConfig) => {
  const keys = _.union(Object.keys(firstConfig), Object.keys(secondConfig));
  const result = keys.map((key) => {
    const beforeValue = firstConfig[key];
    const afterValue = secondConfig[key];

    if (beforeValue instanceof Object && afterValue instanceof Object) {
      return {
        key,
        type: unchanged,
        beforeValue: compareTwoConfigurations(beforeValue, afterValue),
        afterValue: undefined,
      };
    } else if (beforeValue === afterValue) {
      return {
        key,
        type: unchanged,
        beforeValue,
        afterValue: undefined,
      };
    } else if (_.has(firstConfig, key) && _.has(secondConfig, key)) {
      return {
        key,
        type: changed,
        afterValue,
        beforeValue,
      };
    }

    const iter = (obj) => {
      const keysObj = Object.keys(obj);
      return keysObj.map((item) => {
        if (item instanceof Object) {
          return iter(item);
        }

        return {
          key: item,
          type: object,
          beforeValue: obj[item],
          afterValue: undefined,
        };
      });
    };
    const processValue = (value) => {
      const condition = value instanceof Object;
      return condition ? iter(value) : value;
    };

    if (!_.has(firstConfig, key)) {
      return {
        key,
        type: added,
        beforeValue: undefined,
        afterValue: processValue(afterValue),
      };
    }

    return {
      key,
      type: deleted,
      beforeValue: processValue(beforeValue),
      afterValue: undefined,
    };
  });

  return result;
};

export default (path1, path2, keys) => {
  const extname1 = path.extname(path1).substr(1);
  const extname2 = path.extname(path2).substr(1);
  const data1 = fs.readFileSync(path1, 'utf8');
  const data2 = fs.readFileSync(path2, 'utf8');
  const obj1 = getParser(extname1)(data1);
  const obj2 = getParser(extname2)(data2);
  const diff = compareTwoConfigurations(obj1, obj2);
  const format = keys.format;
  const result = getFormatter(format)(diff);
  return result;
};
