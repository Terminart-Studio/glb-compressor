import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { draco, quantize } from '@gltf-transform/functions';
import { DracoMeshCompression } from '@gltf-transform/extensions';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/compress', upload.single('file'), async (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `compressed_${req.file.originalname}`;

  try {
    const io = new NodeIO()
      .registerExtensions([DracoMeshCompression])
      .registerDependencies();

    const document = await io.read(inputPath);

    await document.transform(
      draco({ method: 'edgebreaker' }),
      quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 })
    );

    await io.write(outputPath, document);

    const fileBuffer = fs.readFileSync(outputPath);
    res.setHeader('Content-Disposition', `attachment; filename=${outputPath}`);
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.send(fileBuffer);

    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Compression failed' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Compressor API running on port 3000');
});
