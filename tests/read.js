import test from 'tape';
import { fetchTar } from './utils.js';

test('count files', async function(assert) {
  const fileInfo = await fetchTar('files/simple.tar');
  assert.equal(fileInfo.length, 3, 'has 3 files');
  assert.equal(fileInfo[0].path, 'simple/', 'has simple directory');
  assert.equal(fileInfo[1].path, 'simple/hello.txt', 'has text file');
  assert.end();
});

test('check file headers', async function(assert) {
  const fileInfo = await fetchTar('files/simple.tar');
  assert.equal(fileInfo[2].path, 'simple/tux.png', 'file name is ok');
  assert.equal(fileInfo[2].type, 'file', 'file type is ok');
  assert.equal(fileInfo[2].size, 11913, 'file size is ok');
  assert.end();
});

test('check text file contents', async function(assert) {
  const fileInfo = await fetchTar('files/simple.tar');
  const text = fileInfo
    .find(({ path }) => path === 'simple/hello.txt')
    .getText();
  assert.equal(text, 'hello world! 🙂\n', 'text file contents are ok');
  assert.end();
});