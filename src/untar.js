import Entry from './Entry.js';

const readString = (buffer, strOffset, size) => {
  const strView = new Uint8Array(buffer, strOffset, size);
  const i = strView.indexOf(0);
  const td = new TextDecoder();
  return td.decode(strView.slice(0, i));
};

const readFileName = (buffer, headerOffset) => readString(buffer, headerOffset, 100);

const readFileType = (buffer, headerOffset) => {
  // offset: 156
  const typeView = new Uint8Array(buffer, headerOffset + 156, 1);
  const typeStr = String.fromCharCode(typeView[0]);
  if (typeStr === '0') return 'file';
  if (typeStr === '5') return 'directory';
  return typeStr;
};

const readFileSize = (buffer, headerOffset) => {
  // offset: 124
  const szView = new Uint8Array(buffer, headerOffset + 124, 12);
  let szStr = '';
  for (let i = 0; i < 11; i++) {
    szStr += String.fromCharCode(szView[i]);
  }
  return parseInt(szStr, 8);
};

const readFileInfo = buffer => {
  const fileInfo = [];
  
  let offset = 0;
  let fileSize = 0;       
  let fileName = '';
  let fileType = null;
  while (offset < buffer.byteLength - 512) {
    fileName = readFileName(buffer, offset); // file name
    
    if (!fileName.length) break;

    fileType = readFileType(buffer, offset);
    fileSize = readFileSize(buffer, offset);

    fileInfo.push(new Entry(
      buffer,
      fileName,
      fileType,
      fileSize,
      offset,
    ));

    offset += (512 + 512 * Math.trunc(fileSize / 512));
    if (fileSize % 512) {
      offset += 512;
    }
  }

  return fileInfo;
};

export default async function untar(src) {
  if (src instanceof ArrayBuffer) return readFileInfo(src);
  if (src instanceof Uint8Array) return readFileInfo(src.buffer);

  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = event => {
      resolve(readFileInfo(event.target.result));
    };
    reader.readAsArrayBuffer(src);
  });
};