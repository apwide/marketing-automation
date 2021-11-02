import DataDir from '../cache/datadir.js';
import config from '../config/index.js';

export default function cache<T>(file: string, data: T): T {
  if (!config.isProduction) {
    DataDir.in.file(file).writeJson(data);
  }
  return data;
}
