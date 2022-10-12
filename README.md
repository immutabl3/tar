# tar

fast, browser-oriented tarball manipulation with zero dependencies

## why?

this is a rewrite of [tarballjs](https://github.com/ankitrohatgi/tarballjs). enhancements:
- fixes imports by using esmodules
- works in node
- allows tree-shaking 
- smaller bundle size
- better developer experience

## usage

### `untar`

takes an [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) and returns an array of `entries` representing files and folders

```js
import { untar } from '@immutabl3/tar';

const res = await fetch(url);
const buffer = await res.arrayBuffer();
const entries = await untar(buffer);
```

Entry
* `.path`: _string_ - file's tar path
* `.ext`: _string_ - file's extension (e.g. `png`, `jpg`)
* `.type`: _string_ - 'file' or 'directory'
* `.size`: _number_ - file's byte size
* `.getText()`: _string_ - read the file as a text string
* `.getBinary()`: _Uint8Array_ - read the file as bytes
* `.getBlob(mimetype)`: _Blob_ - read the file as a Blob with the provided mime

### `tar`

creates a writer to add folders and files to. writing the tar returns a [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)

```js
import { tar } from '@immutabl3/tar';

const writer = tar();
writer.addFolder('myfolder/');
writer.addText('myfolder/first.txt', 'this is some text 🙂');
writer.addText('myfolder/second.txt', 'some more text with 🙃 emojis');
const result = await writer.write();
```

## limitations

- File name (including path) has to be less than 100 characters.
- Maximum total file size seems to be limited to somewhere between 500MB to 1GB (exact limit is unknown).

## tests

* `npm install`
* `npm test`

## references

- https://en.wikipedia.org/wiki/Tar_(computing)
- https://www.gnu.org/software/tar/manual/html_node/Standard.html
