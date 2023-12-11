const BASE_URL = "https://api.figma.com/v1";

export const getSvg = async (params: { fileKey: string; ids: string }) => {
  const { fileKey, ids } = params;
  const response = await fetch(
    `${BASE_URL}/images/${fileKey}?ids=${ids}&format=svg`,
    {
      headers: {
        "X-Figma-Token": process.env.FIGMA_TOKEN || "",
      },
    }
  );

  return response.json();
};
