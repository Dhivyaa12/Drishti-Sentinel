import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function urlToDataUri(url: string): Promise<string> {
    // Using a different proxy to bypass CORS issues.
    // Note: It's generally better to have the IP camera stream on a server that sets the correct CORS headers.
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            const reader = new FileReader();
            reader.onloadend = function() {
                resolve(reader.result as string);
            }
            reader.onerror = (error) => {
                console.error("FileReader error:", error);
                // Fallback to placeholder on reader error
                resolve("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.onerror = function() {
            console.error(`XHR error! Failed to fetch from proxy for url: ${url}`);
            // Fallback to placeholder on fetch error
            resolve("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
        };
        xhr.open('GET', proxyUrl);
        xhr.responseType = 'blob';
        xhr.send();
    });
}


export function captureVideoFrame(videoElement: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg');
    }
    // Return a placeholder if canvas context is not available
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
}
