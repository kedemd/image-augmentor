# image-augmentor
A Node.js module to apply random transformations to images.
Useful data augmentation and data generation for machine learning

![alt text](cat.png)
![alt text](augmented-cat.png)

Usage
```
const fs = require('fs');
const createImageAugmentor = require('image-augmentor');

const augmentor = createImageAugmentor({
    shearRange: 0.1,
    rotationRange: 90,
    blurRange: 0.1,
    backgroundColor: { r: 255, g:0, b:0, alpha: 0}
});

async function augment(){
    const source = await sharp (fs.readFileSync('./cat.png')).toBuffer();
    const augmentedImage = await augmentor(source);
    fs.writeFileSync('./augmented-cat.png', augmentedImage);
}
augment();
```

Configuration:
```
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
}
```