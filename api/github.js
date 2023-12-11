export const base = "https://api.github.com";
const github_token = process.env.GITHUB_TOKEN || "";

export const getContent = (filePath, githubData) => {
  // `${base}/repos/${githubData.owner}/${githubData.name}/contents/${filePath}`
  return fetch(
    `https://api.github.com/repos/lemonbase-tech/packages/contents/packages/untitled-icon/package.json\?ref\=main`,

    {
      headers: {
        "content-type": "application/json",
        Authorization: `token ${github_token}`,
      },
    }
  )
    .then((response) => response.json())
    .then((res) =>
      res.sha
        ? { sha: res.sha, contents: JSON.parse(window.atob(res.content)) }
        : {}
    );
};

export const getCommit = (githubData) => {
  // `${base}/repos/${githubData.owner}/${githubData.name}/commits/refs/heads/master`
  return fetch(
    `https://api.github.com/repos/lemonbase-tech/packages/commits/refs/heads/main`,
    {
      headers: {
        "content-type": "application/json",
        Authorization: `token ${github_token}`,
      },
    }
  ).then((response) => response.json());
};

export const createBranch = (sha, githubData) => {
  const branchName = `figma-update-${new Date().getTime()}`;
  const body = { ref: `refs/heads/${branchName}`, sha };
  // `${base}/repos/${githubData.owner}/${githubData.name}/git/refs`
  // POST /repos/:user/:repo/git/refs
  //
  return fetch(
    `https://api.github.com/repos/lemonbase-tech/packages/git/refs`,
    {
      headers: {
        "content-type": "application/json",
        Authorization: `token ${github_token}`,
      },
      body: JSON.stringify(body),
      method: "POST",
    }
  ).then((response) => response.json());
};

export const updatePackage = (message, sha, contents, branch, githubData) => {
  const content = window.btoa(JSON.stringify(contents, null, 2));
  const body = JSON.stringify({ branch, sha, content, message });
  // `${base}/repos/${githubData.owner}/${githubData.name}/contents/package.json`
  return fetch(
    `https://api.github.com/repos/lemonbase-tech/packages/contents/packages/untitled-icon/package.json\?ref\=main`,
    {
      headers: {
        "content-type": "application/json",
        Authorization: `token ${github_token}`,
      },
      body,
      method: "PUT",
    }
  ).then((response) => response.json());
};

export const createPullRequest = (title, content, branchName, githubData) => {
  const body = {
    title,
    body: content,
    head: `${githubData.owner}:${branchName}`,
    base: "main",
  };
  // `${base}/repos/${githubData.owner}/${githubData.name}/pulls`
  return fetch(`https://api.github.com/repos/lemonbase-tech/packages/pulls`, {
    headers: {
      "content-type": "application/json",
      Authorization: `token ${github_token}`,
    },
    body: JSON.stringify(body),
    method: "POST",
  }).then((response) => response.json());
};

export const createSVG = (content) => {
  // /repos/{owner}/{repo}/contents/{path}
  return fetch(
    `https://api.github.com/repos/lemonbase-tech/packages/contents/untitled-icon`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${github_token}`,
      },
      body: JSON.stringify({
        content,
        encoding: "utf-8",
      }),
    }
  ).then((response) => response.json());
};
