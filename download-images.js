import path from "path"
import fs from 'fs';
import https from 'https';
import http from 'http';

const imgs = {
    w_b: 'https://i.postimg.cc/Kvm1WtZm/w-b.png',
    w_p: 'https://i.postimg.cc/8CfcvHbm/w-p.png',
    w_q: 'https://i.postimg.cc/76gLsZdC/w-q.png',
    w_r: 'https://i.postimg.cc/kGqgkdPT/w-r.png',
    w_n: 'https://i.postimg.cc/bwBddM1v/w-n.png',
    w_k: 'https://i.postimg.cc/Vk6df1rT/w-k.png',
    _q: 'https://i.postimg.cc/fyfJLRv4/q.png',
    _p: 'https://i.postimg.cc/W1bJdgK5/p.png',
    _n: 'https://i.postimg.cc/nhR9BMfp/n.png',
    _k: 'https://i.postimg.cc/MZVBNWVm/k.png',
    _b: 'https://i.postimg.cc/LXZPHS7R/b.png',
    _r: 'https://i.postimg.cc/2jQqT0NH/r.png',
}


/**
 * Downloads an image from a URL and saves it locally
 * @param {string} url - The URL of the image to download
 * @param {string} imagePath - The local path where the image should be saved
 * @returns {Promise<string>} - A promise that resolves with the path to the saved image
 */
function downloadImage(url, imagePath) {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    const dirname = path.dirname(imagePath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }

    // Choose http or https based on URL
    const requester = url.startsWith('https') ? https : http;
    
    const request = requester.get(url, (response) => {
      // Check if response is successful
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image. Status code: ${response.statusCode}`));
        return;
      }

      // Check if response is an image
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        reject(new Error(`The URL does not contain an image. Content-Type: ${contentType}`));
        return;
      }

      // Create write stream and pipe the response to it
      const fileStream = fs.createWriteStream(imagePath);
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(imagePath);
      });
      
      fileStream.on('error', (err) => {
        // Clean up: remove the file if there was an error
        fs.unlink(imagePath, () => {});
        reject(err);
      });
    });

    request.on('error', (err) => {
      reject(err);
    });
    
    request.end();
  });
}


async function main() {
    for (const [key, val] of Object.entries(imgs)) {
        const segments = val.split("/")
        const newPath = path.join("./public/assets/imgs", segments[segments.length - 1])
        const savedPath = downloadImage(val, newPath)
        console.log(savedPath);
        
    }

}

main().catch(console.log())