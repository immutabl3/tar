const readFileBlob = (buffer, fileOffset, size, mimetype) => {
  const view = new Uint8Array(buffer, fileOffset, size);
  return new Blob([view], { type: mimetype });
};

const readFileBinary = (buffer, fileOffset, size) => {
  return new Uint8Array(buffer, fileOffset, size);
};

const readTextFile = (buffer, fileOffset, size) => {
  const view = new Uint8Array(buffer, fileOffset, size);
  const td = new TextDecoder();
  return td.decode(view);
};

export default class Entry {
  constructor(buffer, fileName, fileType, fileSize, offset) {
    this.buffer = buffer;
    this.path = fileName;
    this.name = fileName.split('/').pop();
    this.ext = fileName.split('.').pop();
    this.type = fileType;
    this.size = fileSize;
    this.offset = offset;
  }

  getText() {
    return readTextFile(this.buffer, this.offset + 512, this.size); 
  }
  getBlob(mimetype) {
    return readFileBlob(this.buffer, this.offset + 512, this.size, mimetype); 
  }
  getBinary() {
    return readFileBinary(this.buffer, this.offset + 512, this.size); 
  }
}