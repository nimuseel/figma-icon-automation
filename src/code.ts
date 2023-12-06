figma.showUI(__html__, { width: 320, height: 436 });

// get github settings
function getLocalData(key) {
  return figma.clientStorage.getAsync(key);
}

// set github settings
function setLocalData(key, data) {
  figma.clientStorage.setAsync(key, data);
}

// send github data to UI
function init() {
  getLocalData("githubData").then((githubData) => {
    figma.ui.postMessage({ type: "githubDataGot", githubData });
  });
  getLocalData("webhookData").then((webhookData) => {
    figma.ui.postMessage({ type: "webhookDataGot", webhookData });
  });
}

const extractIcon = async () => {
  const flatten = (a, b) => {
    return [...a, ...b];
  };

  const componentNodes = figma.currentPage.selection
    .map(findAllComponentNode)
    .reduce(flatten, [])
    .map(({ id, name }) => ({ id, name }));

  const componentNodesIdsQuery = componentNodes.map(({ id }) => id).join(",");

  const pluginMessage = {
    type: "extractIcon",
    payload: {
      fileKey: figma.fileKey as string,
      ids: componentNodesIdsQuery,
      nodes: componentNodes,
    },
  };
  console.log(
    "🚀 ~ file: code.ts:44 ~ extractIcon ~ pluginMessage:",
    pluginMessage
  );

  figma.ui.postMessage(pluginMessage);
};

figma.ui.onmessage = (msg) => {
  switch (msg.type) {
    case "setGithubData":
      setLocalData("githubData", msg.githubData);
      break;
    case "setWebhookData":
      setLocalData("webhookData", msg.webhookData);
      break;
    case "cancel":
      figma.closePlugin();
      break;
    case "extract":
      extractIcon();
      break;
  }
};

init();

function findAllComponentNode(rootNode: SceneNode) {
  const result: ComponentNode[] = [];
  function findComponentNode(node: SceneNode) {
    if (isComponentNode(node)) {
      result.push(node as any);
      return;
    }
    if ("children" in node) {
      node.children.forEach(findComponentNode);
    }
  }
  findComponentNode(rootNode);
  return result;
}

function isComponentNode(node: SceneNode) {
  return node.type === "COMPONENT";
}
