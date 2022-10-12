import test from 'tape';
import { generateTar } from './utils.js';

test('count files', async function(assert) {
  const fileInfo = await generateTar();
  assert.equal(fileInfo.length, 3, 'file count is ok');
  assert.end();
});

test('check file headers', async function(assert) {
  const fileInfo = await generateTar();
  assert.equal(fileInfo[1].path, 'myfolder/first.txt', 'file path is ok');
  assert.equal(fileInfo[1].type, 'file', 'file type is ok');
  assert.equal(fileInfo[1].size, 22, 'file size is ok');
  assert.end();
});

test('check text file contents', async function(assert) {
  const fileInfo = await generateTar();
  const text = fileInfo
    .find(({ path }) => path === 'myfolder/second.txt')
    .getText();
  assert.equal(text, 'some more text with 🙃 emojis', 'text file contents are ok');
  assert.end();
});