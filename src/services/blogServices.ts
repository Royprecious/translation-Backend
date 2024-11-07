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
  