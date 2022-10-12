import path from 'path';
import fs from 'fs/promises';
import { tar, untar } from '../src/index.js';

const testPath = path.resolve(process.cwd(), './tests');

export const fetchTar = async function(filename) { 
  const filepath = path.resolve(testPath, filename);
  const file = await fs.readFile(filepath);
  return untar(file.buffer);
};

export const generateTar = async function() {
  // generate a tarball and read it back
  const writer = tar();
  writer.addFolder('myfolder/');
  writer.addTextFile('myfolder/first.txt', 'this is some text 🙂');
  writer.addTextFile('myfolder/second.txt', 'some more text with 🙃 emojis');
  const result = await writer.write();
  return untar(result);
};