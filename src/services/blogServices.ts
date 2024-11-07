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
  

export function extractBase64FromImages(content: string): string[] {
  const base64Data: string[] = [];
  
  const regex = /<img\s+[^>]*src=["'](data:image\/[a-zA-Z]*;base64,[^"']+)["'][^>]*>/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
      base64Data.push(match[1]);
  }
  
  convertImagesToBuffer(base64Data);

  return base64Data;
}


function convertImagesToBuffer(images:any){


       let allConvertedImages = [];

      for(let i = 0; i < images.length; i++){
         
             
             const base64Image = images[i];
             const imageType = getImageTypeFromBase64(base64Image);

             const base64Data =  base64Image.replace(/^data:image\/\w+;base64,/, "");

             const bufferImage = Buffer.from(base64Data, 'base64');


             allConvertedImages.push(bufferImage);

             const blobName = `"image"-${i + 1}.jpg`;
             console.log('This name is ', blobName);
      }
     
      console.log(allConvertedImages);
      return allConvertedImages;

}


function getImageTypeFromBase64(base64String: string): string {
  const match = base64String.match(/^data:image\/([a-zA-Z]*);base64,/);
  return match ? match[1] : 'unknown';  
}
