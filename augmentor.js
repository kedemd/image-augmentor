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
        backgroundColor = {r: 255, g: 255, b: 255}
    } = transformationConfig;

    const sharpImage = sharp(imageBuffer).flatten({background: backgroundColor});
    const metadata = await sharpImage.metadata();
    const width = metadata.width;
    const height = metadata.height;

    let transformedImage = sharpImage;

    // Apply transpose transformation
    if (transposeRange) {
        const randomTransposeX = getRandomInRange(transposeRange);
        const randomTransposeY = getRandomInRange(transposeRange);
        transformedImage = transformedImage.extract({left: randomTransposeX, top: randomTransposeY, width, height});
    }

    // Resize the image if needed
    if (zoomRange) {
        const randomZoomFactor = 1 + Math.random() * zoomRange;
        const zoomX = Math.round(width * randomZoomFactor);
        const zoomY = Math.round(height * randomZoomFactor);
        transformedImage = transformedImage.resize(zoomX, zoomY , { background: backgroundColor });
    }

    // Apply shear transformation
    if (shearRange) {
        const randomShearX = getRandomInRange(shearRange);
        const randomShearY = getRandomInRange(shearRange);
        transformedImage = transformedImage.affine([[1, randomShearX], [randomShearY, 1]], { background: backgroundColor });
    }

    // Apply rotation transformation
    if (rotationRange) {
        const randomRotationAngle = getRandomInRange(rotationRange);
        transformedImage = transformedImage.rotate(randomRotationAngle, { background: backgroundColor });
    }

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

    const outputImage = sharp(await transformedImage.toBuffer()).resize(width, height, { background: backgroundColor });
    return outputImage.toBuffer();
}

module.exports = exports = function createImageAugmentor(config) {
    return async function (imageBuffer) {
        return await applyTransformations(imageBuffer, config);
    };
};
