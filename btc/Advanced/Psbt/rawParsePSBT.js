const parsePSBT = (psbtBase64) => {
  const psbtBuffer = Buffer.from(psbtBase64, 'base64');
  let index = 0;

  // 魔术字节和分隔符
  const magicBytes = psbtBuffer.slice(index, index + 5);
  index += 5;
  if (magicBytes.toString('hex') !== '70736274ff') {
    throw new Error('Not a valid PSBT');
  }

  // 解析全局部分
  console.log('Global Data:');
  while (psbtBuffer[index] !== 0x00 && index < psbtBuffer.length) {
    if (index + 2 > psbtBuffer.length) break; // Prevent reading beyond buffer
    const keyLen = psbtBuffer[index];
    const key = psbtBuffer.slice(index + 1, index + 1 + keyLen);
    index += 1 + keyLen;

    if (index + 1 > psbtBuffer.length) break; // Prevent reading beyond buffer
    const valueLen = psbtBuffer.readIntLE(index, 1);
    const value = psbtBuffer.slice(index + 1, index + 1 + valueLen);
    index += 1 + valueLen;

    console.log(`Key: ${key.toString('hex')}, Value: ${value.toString('hex')}`);
  }
  index++; // Skip separator

  // 解析输入部分
  console.log('Inputs:');
  while (index < psbtBuffer.length && psbtBuffer[index] !== 0x00) {
    while (psbtBuffer[index] !== 0x00 && index < psbtBuffer.length) {
      if (index + 2 > psbtBuffer.length) break;
      const keyLen = psbtBuffer[index];
      const key = psbtBuffer.slice(index + 1, index + 1 + keyLen);
      index += 1 + keyLen;

      if (index + 1 > psbtBuffer.length) break;
      const valueLen = psbtBuffer.readUIntLE(index, 1);
      const value = psbtBuffer.slice(index + 1, index + 1 + valueLen);
      index += 1 + valueLen;
      console.log(`Key: ${key.toString('hex')}, Value: ${value.toString('hex')}`);
    }
    index++; // Skip separator
  }
  index++; // Skip separator

  // 解析输出部分
  console.log('Outputs:');
  while (index < psbtBuffer.length && psbtBuffer[index] !== 0x00) {
    console.log(`Output at index ${index}:`);
    while (psbtBuffer[index] !== 0x00 && index < psbtBuffer.length) {
      if (index + 2 > psbtBuffer.length) break;
      const keyLen = psbtBuffer[index];
      const key = psbtBuffer.slice(index + 1, index + 1 + keyLen);
      index += 1 + keyLen;

      if (index + 1 > psbtBuffer.length) break;
      const valueLen = psbtBuffer.readUIntLE(index, 1);
      const value = psbtBuffer.slice(index + 1, index + 1 + valueLen);
      index += 1 + valueLen;

      console.log(`Key: ${key.toString('hex')}, Value: ${value.toString('hex')}`);
    }
    index++; // Skip separator
  }
};

// 用你提供的Base64字符串测试
const psbtBase64 =
  'cHNidP8BAHUCAAAAASaBcTce3/KF6Tet7qSze3gADAVmy7OtZGQXE8pCFxv2AAAAAAD+////AtPf9QUAAAAAGXapFNDFmQPFusKGh2DpD9UhpGZap2UgiKwA4fUFAAAAABepFDVF5uM7gyxHBQ8k0+65PJwDlIvHh7MuEwAAAQD9pQEBAAAAAAECiaPHHqtNIOA3G7ukzGmPopXJRjr6Ljl/hTPMti+VZ+UBAAAAFxYAFL4Y0VKpsBIDna89p95PUzSe7LmF/////4b4qkOnHf8USIk6UwpyN+9rRgi7st0tAXHmOuxqSJC0AQAAABcWABT+Pp7xp0XpdNkCxDVZQ6vLNL1TU/////8CAMLrCwAAAAAZdqkUhc/xCX/Z4Ai7NK9wnGIZeziXikiIrHL++E4sAAAAF6kUM5cluiHv1irHU6m80GfWx6ajnQWHAkcwRAIgJxK+IuAnDzlPVoMR3HyppolwuAJf3TskAinwf4pfOiQCIAGLONfc0xTnNMkna9b7QPZzMlvEuqFEyADS8vAtsnZcASED0uFWdJQbrUqZY3LLh+GFbTZSYG2YVi/jnF6efkE/IQUCSDBFAiEA0SuFLYXc2WHS9fSrZgZU327tzHlMDDPOXMMJ/7X85Y0CIGczio4OFyXBl/saiK9Z9R5E5CVbIBZ8hoQDHAXR8lkqASECI7cr7vCWXRC+B3jv7NYfysb3mk6haTkzgHNEZPhPKrMAAAAAAAAA';
parsePSBT(psbtBase64);
