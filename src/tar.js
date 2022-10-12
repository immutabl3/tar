const noop = () => {};

const leftPad = (number, targetLength) => {
  let output = `${number}`;
  while (output.length < targetLength) {
    output = `0${output}`;
  }
  return output;
};

const createBuffer = fileData => {
  let tarDataSize = 0;
  for (let i = 0; i < fileData.length; i++) {                        
    const size = fileData[i].size;
    tarDataSize += 512 + 512 * Math.trunc(size / 512);
    if (size % 512) {
      tarDataSize += 512;
    }
  }
  let bufSize = 10240 * Math.trunc(tarDataSize / 10240);
  if (tarDataSize % 10240) {
    bufSize += 10240;
  }
  return new ArrayBuffer(bufSize); 
};

const writeString = (buffer, str, offset, size) => {
  const strView = new Uint8Array(buffer, offset, size);
  const te = new TextEncoder();
  if (te.encodeInto) {
    // let the browser write directly into the buffer
    const written = te.encodeInto(str, strView).written;
    for (let i = written; i < size; i++) {
      strView[i] = 0;
    }
  } else {
    // browser can't write directly into the buffer, do it manually
    const arr = te.encode(str);
    for (let i = 0; i < size; i++) {
      strView[i] = i < arr.length ? arr[i] : 0;
    }
  }
};

const writeFileName = (buffer, name, headerOffset) => {
  // offset: 0
  writeString(buffer, name, headerOffset, 100);
};

const writeFileType = (buffer, typeStr, headerOffset) => {
  // offset: 156
  let typeChar = '0';
  if (typeStr === 'file') {
    typeChar = '0';
  } else if (typeStr === 'directory') {
    typeChar = '5';
  }
  const typeView = new Uint8Array(buffer, headerOffset + 156, 1);
  typeView[0] = typeChar.charCodeAt(0); 
};

const writeFileSize = (buffer, size, headerOffset) => {
  // offset: 124
  let sz = size.toString(8);
  sz = leftPad(sz, 11);
  writeString(buffer, sz, headerOffset + 124, 12);
};

const writeFileMode = (buffer, mode, headerOffset) => {
  // offset: 100
  writeString(buffer, leftPad(mode,7), headerOffset + 100, 8);         
};

const writeFileUid = (buffer, uid, headerOffset) => {
  // offset: 108
  writeString(buffer, leftPad(uid,7), headerOffset + 108, 8);
};
  
const writeFileGid = (buffer, gid, headerOffset) => {
  // offset: 116
  writeString(buffer, leftPad(gid,7), headerOffset + 116, 8);
};

const writeFileMtime = (buffer, mtime, headerOffset) => {
  // offset: 136
  writeString(buffer, leftPad(mtime,11), headerOffset + 136, 12);
};

const writeFileUser = (buffer, user, headerOffset) => {
  // offset: 265
  writeString(buffer, user, headerOffset + 265, 32);
};
  
const writeFileGroup = (buffer, group, headerOffset) => {
  // offset: 297
  writeString(buffer, group, headerOffset + 297, 32);
};

const writeChecksum = (buffer, headerOffset) => {
  // offset: 148
  writeString(buffer, '        ', headerOffset + 148, 8); // first fill with spaces

  // add up header bytes
  const header = new Uint8Array(buffer, headerOffset, 512);
  let chksum = 0;
  for (let i = 0; i < 512; i++) {
    chksum += header[i];
  }
  writeString(buffer, chksum.toString(8), headerOffset + 148, 8);
};

const fillHeader = (buffer, headerOffset, {
  fileType,
  uid = 1000,
  gid = 1000,
  mode = fileType === 'file' ? '664' : '775',
  mtime = Date.now(),
  user = 'tarballjs',
  group = 'tarballjs',
} = {}) => {
  writeFileMode(buffer, mode, headerOffset);
  writeFileUid(buffer, uid.toString(8), headerOffset);
  writeFileGid(buffer, gid.toString(8), headerOffset);
  writeFileMtime(buffer, Math.trunc(mtime / 1000).toString(8), headerOffset);

  writeString(buffer, 'ustar', headerOffset + 257,6); // magic string
  writeString(buffer, '00', headerOffset + 263,2); // magic version

  writeFileUser(buffer, user, headerOffset);
  writeFileGroup(buffer, group, headerOffset);
};

export default function tar() {
  const fileData = [];


  return {
    addTextFile(name, text, opts) {
      const te = new TextEncoder();
      const arr = te.encode(text);
      fileData.push({
        name,
        array: arr,
        type: 'file',
        size: arr.length,
        dataType: 'array',
        opts,
      });
    },

    addFileArrayBuffer(name, arrayBuffer, opts) {
      const arr = new Uint8Array(arrayBuffer);
      fileData.push({
        name,
        array: arr,
        type: 'file',
        size: arr.length,
        dataType: 'array',
        opts,
      });
    },

    addFile(name, file, opts) {
      fileData.push({
        name,
        file,
        size: file.size,
        type: 'file',
        dataType: 'file',
        opts,
      });
    },

    addFolder(name, opts) {
      fileData.push({
        name,
        type: 'directory',
        size: 0,
        dataType: 'none',
        opts,
      });
    },

    async download(filename) {
      const blob = await this.writeBlob();
      const elem = document.createElement('a');
      elem.href = URL.createObjectURL(blob);
      elem.download = filename;
      elem.style.display = 'none';
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    },

    async writeBlob(onUpdate) {
      return new Blob([await this.write(onUpdate)], {
        type: 'application/x-tar'
      });
    },

    async write(onUpdate = noop) {
      return new Promise(resolve => {
        const buffer = createBuffer(fileData);
        
        let offset = 0;
        let filesAdded = 0;
        
        const onFileDataAdded = () => {
          filesAdded++;
          if (onUpdate) {
            onUpdate(filesAdded / fileData.length * 100);
          }
          if (filesAdded === fileData.length) {
            resolve(new Uint8Array(buffer));
          }
        };

        for (let fileIdx = 0; fileIdx < fileData.length; fileIdx++) {
          const fdata = fileData[fileIdx];
          // write header
          writeFileName(buffer, fdata.name, offset);
          writeFileType(buffer, fdata.type, offset);
          writeFileSize(buffer, fdata.size, offset);
          fillHeader(buffer, offset, fdata.type, fdata.opts);
          writeChecksum(buffer, offset);

          // write file data
          const destArray = new Uint8Array(buffer, offset + 512, fdata.size);
          if (fdata.dataType === 'array') {
            for (let byteIdx = 0; byteIdx < fdata.size; byteIdx++) {
              destArray[byteIdx] = fdata.array[byteIdx];
            }
            onFileDataAdded();
          }
          if (fdata.dataType === 'file') {
            const reader = new FileReader();

            reader.onload = (function(outArray) {
              return function(event) {
                const sbuf = event.target.result;
                const sarr = new Uint8Array(sbuf);
                for (let bIdx = 0; bIdx < sarr.length; bIdx++) {
                  outArray[bIdx] = sarr[bIdx];
                }
                onFileDataAdded();
              };
            }(destArray));

            reader.readAsArrayBuffer(fdata.file);
          } 
          if (fdata.type === 'directory') {
            onFileDataAdded();
          }

          offset += (512 + 512 * Math.trunc(fdata.size / 512));
          if (fdata.size % 512) {
            offset += 512;
          }
        }
      });
    },
  };
};