import * as nsfwjs from 'nsfwjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';

// Cache the models so we don't reload them every time
let nsfwModel: nsfwjs.NSFWJS | null = null;
let objModel: mobilenet.MobileNet | null = null;

// Definition of safety thresholds for NSFW
const NSFW_THRESHOLDS = {
    Porn: 0.85,      // High threshold (85%) to avoid false positives (e.g. skin-tone food/coffee). Real porn is usually >95%.
    Hentai: 0.80,    // 80% probability
    Sexy: 0.90,      // Very high threshold (90%). Only block if extremely suggestive.
};

// Banned Keywords for Object Detection (Lowercase)
// These match ImageNet/MobileNet class labels
const BANNED_OBJECTS = [
    'assault rifle',
    'rifle',
    'revolver',
    'projectile',
    'missile',
    'gun',
    'cannon',
    'mask',
    'ski mask',
    'gas mask',
    'machete', // Usually agricultural but often used as weapon. Keep banned? Or remove if selling farming tools. Keeping for safety.
    'sword',
    'military uniform', // Often associated with violence in context
];

/**
 * Checks an image file for inappropriate content using AI (NSFW + Violence/Weapons).
 * Returns null if safe, or an error string describing the issue if unsafe.
 */
export async function checkImageContent(file: File): Promise<string | null> {
    try {
        // Load models if not already loaded
        if (!nsfwModel) {
            nsfwModel = await nsfwjs.load();
        }
        if (!objModel) {
            objModel = await mobilenet.load();
        }

        // Create an HTMLImageElement to pass to the classifier
        const img = document.createElement('img');
        const objectUrl = URL.createObjectURL(file);

        return new Promise((resolve) => {
            img.onload = async () => {
                if (!nsfwModel || !objModel) {
                    resolve(null);
                    return;
                }

                // ----------------------------------------
                // 1. Run NSFW Classification
                // ----------------------------------------
                const nsfwPredictions = await nsfwModel.classify(img);

                const porn = nsfwPredictions.find(p => p.className === 'Porn');
                const hentai = nsfwPredictions.find(p => p.className === 'Hentai');
                const sexy = nsfwPredictions.find(p => p.className === 'Sexy');

                if (porn && porn.probability > NSFW_THRESHOLDS.Porn) {
                    URL.revokeObjectURL(objectUrl);
                    resolve(`Image rejected: Detected explicit content (${(porn.probability * 100).toFixed(0)}% confidence).`);
                    return;
                }

                if (hentai && hentai.probability > NSFW_THRESHOLDS.Hentai) {
                    URL.revokeObjectURL(objectUrl);
                    resolve(`Image rejected: Detected animated explicit content (${(hentai.probability * 100).toFixed(0)}% confidence).`);
                    return;
                }

                if (sexy && sexy.probability > NSFW_THRESHOLDS.Sexy) {
                    URL.revokeObjectURL(objectUrl);
                    resolve(`Image rejected: Content deemed too suggestive (${(sexy.probability * 100).toFixed(0)}% confidence).`);
                    return;
                }

                // ----------------------------------------
                // 2. Run Object/Weapon Detection
                // ----------------------------------------
                const objPredictions = await objModel.classify(img);
                // predictions format: [{ className: 'assault rifle, assault gun', probability: 0.98 }, ...]

                for (const pred of objPredictions) {
                    const label = pred.className.toLowerCase();
                    // Check if any banned keyword is in the label
                    const isBanned = BANNED_OBJECTS.some(banned => label.includes(banned));

                    if (isBanned && pred.probability > 0.45) { // 45% confidence threshold for objects
                        URL.revokeObjectURL(objectUrl);
                        resolve(`Image rejected: Detected prohibited object "${pred.className}" (${(pred.probability * 100).toFixed(0)}% confidence).`);
                        return;
                    }
                }

                // If safe
                URL.revokeObjectURL(objectUrl);
                resolve(null);
            };

            img.onerror = () => {
                resolve('Failed to process image for safety check.');
            };

            img.src = objectUrl;
        });

    } catch (error) {
        console.error('Content moderation failed:', error);
        return null; // Fail open to avoid blocking due to technical error
    }
}
