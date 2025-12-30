const API_KEY = 'AIzaSyDWmxmpEujOWPDva_KjsrKjUrPLXbbztHc';
const MODEL = 'gemini-3-pro-image-preview';

export async function generateImage({ prompt, images, aspectRatio = 'auto', resolution = '1k', count = 1 }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  // Convert images to the format expected by Gemini API (base64)
  const imageParts = await Promise.all(
    images.map(async (img) => {
      const base64Data = img.split(',')[1];
      const mimeType = img.split(';')[0].split(':')[1];
      return {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };
    })
  );

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          ...imageParts,
        ],
      },
    ],
    generationConfig: {
      candidateCount: parseInt(count),
      imageConfig: {
        aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio,
        imageSize: resolution.toUpperCase(),
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();

    // Extract all images from all candidates
    const generatedImages = data.candidates?.map(candidate => {
      const part = candidate.content?.parts?.find(p => p.inlineData);
      if (part) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      return null;
    }).filter(img => img !== null) || [];

    if (generatedImages.length > 0) {
      return generatedImages;
    }

    // If it's text response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textResponse) {
      throw new Error(`Model returned text instead of image: ${textResponse}`);
    }

    throw new Error('No image generated in the response');
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}
