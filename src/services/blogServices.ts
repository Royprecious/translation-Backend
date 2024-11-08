import { ImageObjects } from "../models/types";


export async function generateRandomId() {

        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    
}
export async function verifyDate(date: Date): Promise<number> {
    const currentDate = new Date();
    if (date < currentDate) {
      return 0;
    }
    return 1; 
}
  

export async function processRichTextContent(content: string): Promise<string> {
  try {
    const base64Images = extractBase64FromImages(content);
    const bufferImages = await convertImagesToBuffer(base64Images);
    const imageMappings = await uploadToAzure(bufferImages);
    const updatedContent = mergeLatestContent(content, imageMappings);
    return updatedContent;
  } catch (error) {
    console.error("Error processing rich text content:", error);
    throw new Error("Failed to process rich text content.");
  }
}


function extractBase64FromImages(content: string): string[] {
  const base64Data: string[] = [];
  const regex = /<img\s+[^>]*src=["'](data:image\/[a-zA-Z]*;base64,[^"']+)["'][^>]*>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    base64Data.push(match[1]);
  }
  return base64Data;
}


async function convertImagesToBuffer(images: string[]): Promise<Buffer[]> {
  return images.map(base64Image => {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, 'base64');
  });
}



async function uploadToAzure(bufferImages: Buffer | Buffer[]): Promise<ImageObjects[]> {
  const imageArray = Array.isArray(bufferImages) ? bufferImages : [bufferImages];
  const imgUrls = [
    "https://i.pinimg.com/564x/ed/d5/02/edd502762e217ed59da71d007ec1ff3b.jpg",
    "https://www.carpro.com/hs-fs/hubfs/2023-Chevrolet-Corvette-Z06-credit-chevrolet.jpeg?width=1020&name=2023-Chevrolet-Corvette-Z06-credit-chevrolet.jpeg"
  ];

  return imageArray.map((bufferImage, i) => ({
    original: bufferImage.toString("base64"),
    newUrl: imgUrls[i % imgUrls.length]
  }));
}


function mergeLatestContent(content: string, imageMappings: ImageObjects[]): string {
  const regex = /<img\s+[^>]*src=["'](data:image\/[a-zA-Z]*;base64,[^"']+)["'][^>]*>/g;

  return content.replace(regex, (match, base64Data) => {
    const mapping = imageMappings.find(img => img.original === base64Data);
    const newUrl = mapping ? mapping.newUrl : "https://placeholder.url/for-missing-images.jpg";
    return `<img src="${newUrl}" />`;
  });
}




export async function saveCoverImage(image: string): Promise<string> {
  const bufferImage = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
  const [uploadedImage] = await uploadToAzure(bufferImage); 
  return uploadedImage.newUrl;
}
