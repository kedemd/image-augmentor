const sharp = require('sharp');

/**
 * @typedef {Object} TransformationConfig
 * @property {number} [shearRange=0] - The range within which to randomly shear the image.
 *                                       A positive or negative shear can be applied.
 * @property {number} [rotationRange=0] - The range within which to randomly rotate the image.
 *                                         The image can be rotated either clockwise or counter-clockwise.
 * @property {number} [blurRange=0] - The range within which to randomly blur the image.
 * @property {number} [zoomRange=0] - The range within which to randomly zoom the image.
 *                                     A zoom in or out can be applied.
 * @property {number} [sharpenRange=0] - The range within which to randomly sharpen the image.
 * @property {number} [brightnessRange=0] - The range within which to randomly adjust the brightness of the image.
 *                                           The brightness can be increased or decreased.
 * @property {number} [saturationRange=0] - The range within which to randomly adjust the saturation of the image.
 *                                           The saturation can be increased or decreased.
 * @property {number} [contrastRange=0] - The range within which to randomly adjust the contrast of the image.
 *                                         The contrast can be increased or decreased.
 * @property {number} [transposeRange=0] - The range within which to randomly transpose the image.
 *                                          The image can be transposed either to the right or to the left.
 * @property {Object} [backgroundColor={r: 255, g: 255, b: 255}] - The background color to use when applying transformations.
 */

/**
 * Generates a random number within a range.
 * For negative ranges, the function returns a number between -range and +range.
 * @param {number} range - The range within which to generate the random number.
 * @return {number} - The generated random number.
 */
function getRandomInRange(range) {
    return Math.random() * range * 2 - range;
}

function transposeImage(transformedImage, transposeX, transposeY, width, height, backgroundColor) {
    transposeX = Math.min(transposeX, width);
    transposeY = Math.min(transposeY, height);

    const newWidth = width - Math.abs(transposeX);
    const newHeight = height - Math.abs(transposeY);

    if (transposeX >= 0) {
        // Transpose to right
        transformedImage = transformedImage
            .extract({ left: transposeX, top: 0, width: newWidth, height: height })
            .extend({ top: 0, bottom: 0, left: transposeX, right: 0, background: backgroundColor });
    } else {
        // Transpose to left
        transformedImage = transformedImage
            .extend({ top: 0, bottom: 0, left: -transposeX, right: 0, background: backgroundColor })
            .extract({ left: 0, top: 0, width: newWidth, height: height });
    }
    if (transposeY >= 0) {
        // Transpose down
        transformedImage = transformedImage
            .extract({ left: 0, top: transposeY, width: newWidth, height: newHeight })
            .extend({ top: transposeY, bottom: 0, left: 0, right: 0, background: backgroundColor });
    } else {
        // Transpose up
        transformedImage = transformedImage
            .extend({ top: -transposeY, bottom: 0, left: 0, right: 0, background: backgroundColor })
            .extract({ left: 0, top: 0, width: newWidth, height: newHeight });
    }

    return transformedImage;
}

const cropToCenter = (transformedImage, width, height) => {
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const halfOriginalWidth = Math.floor(width / 2);
    const halfOriginalHeight = Math.floor(height / 2);
    const left = Math.max(0, centerX - halfOriginalWidth);
    const top = Math.max(0, centerY - halfOriginalHeight);

    return transformedImage.extract({ left: left, top: top, width, height }).flatten(true);
};
/**
 * Applies various transformations to an image.
 * @async
 * @param {Buffer} imageBuffer - The buffer containing the image data.
 * @param {TransformationConfig} transformationConfig - Configuration object for transformations.
 * @return {Promise<Buffer>} - Promise that resolves with the transformed image buffer.
 */
async function applyTransformations(imageBuffer, transformationConfig) {
    const {
        shearRange = 0,
        rotationRange = 0,
        blurRange = 0,
        zoomRange = 0,
        sharpenRange = 0,
        brightnessRange = 0,
        saturationRange = 0,
        contrastRange = 0,
        transposeRange = 0,
        backgroundColor = {r: 255, g: 255, b: 255, alpha: 1}
    } = transformationConfig;

    // Create a blank canvas
    const sharpImage = sharp(imageBuffer);
    const metadata = await sharpImage.metadata();
    const width = metadata.width;
    const height = metadata.height;

    // Padding for transformations
    const padding = Math.max(width, height);
    const wrapperWidth = width + 2 * padding;
    const wrapperHeight = height + 2 * padding;

    // Create a blank canvas larger than the image with padding
    const canvas = sharp({
        create: {
            width: wrapperWidth,
            height: wrapperHeight,
            channels: 4,
            background: backgroundColor
        }
    }).composite([{
        input: imageBuffer,
        top: padding,
        left: padding
    }]).toFormat(metadata.format);

    let transformedImage = sharp(await canvas.toBuffer());

    if (blurRange) {
        const scalingFactor = 10; // Adjust the scaling factor to control the range
        const minBlurSigma = 0.3; // Minimum value for blur sigma
        const maxBlurSigma = Math.min(blurRange * scalingFactor, 1000); // Maximum value limited to 1000
        const randomBlurSigma = Math.random() * (maxBlurSigma - minBlurSigma) + minBlurSigma;

        transformedImage = transformedImage.blur(Math.max(0.3, Math.min(randomBlurSigma, 1000)));
    }

    // Apply sharpen transformation
    if (sharpenRange) {
        const scalingFactor = 999999; // Adjust the scaling factor to control the range (999999 is close to 1000000 without exceeding it)
        const minSharpenSigma = 0.000001; // Minimum value for sharpen sigma
        const maxSharpenSigma = Math.min(sharpenRange * scalingFactor, 10); // Maximum value limited to 10
        const randomSharpenSigma = Math.random() * (maxSharpenSigma - minSharpenSigma) + minSharpenSigma;
        transformedImage = transformedImage.sharpen({sigma: randomSharpenSigma});
    }

    // Apply brightness adjustment
    if (brightnessRange) {
        const randomBrightness = getRandomInRange(brightnessRange);
        transformedImage = transformedImage.modulate({brightness: 1 + randomBrightness});
    }

    // Apply saturation adjustment
    if (saturationRange) {
        const randomSaturation = getRandomInRange(saturationRange);
        transformedImage = transformedImage.modulate({saturation: 1 + randomSaturation});
    }

    // Apply contrast adjustment
    if (contrastRange) {
        const randomContrast = getRandomInRange(contrastRange);
        transformedImage = transformedImage.modulate({contrast: 1 + randomContrast});
    }

    // Apply shear transformation
    if (shearRange) {
        const randomShearX = getRandomInRange(shearRange);
        const randomShearY = getRandomInRange(shearRange);
        transformedImage = transformedImage
            .affine([[1, randomShearX], [randomShearY, 1]], { background: backgroundColor })
            .resize(wrapperWidth, wrapperHeight);

        transformedImage = cropToCenter(transformedImage, wrapperWidth, wrapperHeight);
    }

    await transformedImage.toFile('out.png');

    // Apply rotation transformation
    if (rotationRange) {
        const randomRotationAngle = getRandomInRange(rotationRange);
        transformedImage = transformedImage
            .rotate(randomRotationAngle, { background: backgroundColor })
            .resize(wrapperWidth, wrapperHeight);

        transformedImage = cropToCenter(transformedImage, wrapperWidth, wrapperHeight);
    }

    // Apply transpose transformation
    if (transposeRange) {
        const randomTransposeX = Math.round((Math.random() - 0.5) * 2 * transposeRange);
        const randomTransposeY = Math.round((Math.random() - 0.5) * 2 * transposeRange);
        transformedImage = transposeImage(transformedImage, randomTransposeX, randomTransposeY, wrapperWidth, wrapperHeight, backgroundColor);
        transformedImage = cropToCenter(transformedImage, wrapperWidth, wrapperHeight);
    }

    await transformedImage.toFile('out.png');

    // Resize the image if needed
    if (zoomRange) {
        transformedImage = sharp(await transformedImage.toBuffer());

        const randomZoomFactor = (Math.random() - 0.5) * 2 * zoomRange;
        let zoomX, zoomY;
        if (randomZoomFactor >= 0) {
            // Zoom in
            zoomX = Math.round(wrapperWidth * (1 + randomZoomFactor));
            zoomY = Math.round(wrapperHeight * (1 + randomZoomFactor));
            transformedImage = transformedImage.resize(zoomX, zoomY , { background: backgroundColor });
        } else {
            // Zoom out
            // First, calculate the scale factor making sure the image is not smaller than the original
            const scaleFactor = Math.max(1 / (1 + Math.abs(randomZoomFactor)), 1);
            zoomX = Math.round(wrapperWidth * scaleFactor);
            zoomY = Math.round(wrapperHeight * scaleFactor);
            // Next, generate the larger image for the zoom out
            transformedImage = transformedImage
                .resize(zoomX, zoomY, { background: backgroundColor })
                .extend({
                    top: (zoomY - height) / 2,
                    bottom: (zoomY - height) / 2,
                    left: (zoomX - width) / 2,
                    right: (zoomX - width) / 2,
                    background: backgroundColor,
                });
        }
    }

    await transformedImage.toFile('out.png');

    transformedImage = sharp(await transformedImage.toBuffer());

    // Extract the center part
    const tMetadata = await transformedImage.metadata();
    const centerX = Math.floor(tMetadata.width / 2);
    const centerY = Math.floor(tMetadata.height / 2);
    const halfOriginalWidth = Math.floor(width / 2);
    const halfOriginalHeight = Math.floor(height / 2);
    const left = Math.max(0, centerX - halfOriginalWidth);
    const top = Math.max(0, centerY - halfOriginalHeight);

    transformedImage = transformedImage.extract({ left: left, top: top, width, height });

    // Resize the extracted part to the original dimensions
    transformedImage = transformedImage.resize(width, height, { fit: 'fill' });

    return await transformedImage.toBuffer();
}

/**
 * Creates an image augmentor function with a specific set of transformations defined by the config.
 *
 * @param {TransformationConfig} config - Configuration object for transformations.
 * @returns {Function} A function that takes an image buffer and applies the transformations defined in the config.
 * This function is asynchronous and returns a Promise that resolves with the transformed image buffer.
 *
 * @example
 *
 * const config = {
 *     shearRange: 10,
 *     rotationRange: 180,
 *     blurRange: 5,
 *     zoomRange: 2,
 *     sharpenRange: 2,
 *     brightnessRange: 0.5,
 *     saturationRange: 0.5,
 *     contrastRange: 0.5,
 *     transposeRange: 50,
 *     backgroundColor: {r: 255, g: 255, b: 255}
 * };
 *
 * const augmentImage = createImageAugmentor(config);
 *
 * // Then, you can use `augmentImage` with any image buffer.
 * const fs = require('fs');
 * const imageBuffer = fs.readFileSync('path/to/your/image.jpg');
 *
 * augmentImage(imageBuffer).then((augmentedImageBuffer) => {
 *     fs.writeFileSync('path/to/save/augmented/image.jpg', augmentedImageBuffer);
 * });
 */
function createImageAugmentor(config) {
    return async function (imageBuffer) {
        return await applyTransformations(imageBuffer, config);
    };
}

module.exports = exports = createImageAugmentor;