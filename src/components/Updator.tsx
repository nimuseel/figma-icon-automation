import * as React from "react";
import Webhook from "./Webhook";
import {
  getContent,
  getCommit,
  updatePackage,
  createPullRequest,
  createBranch,
  createSVG,
} from "../../api/github";
import { sendNotification } from "../../api/webhook";
import { versionValue } from "../../utils/helper";
import { getSvg } from "../useFigmaAPI";

declare function require(path: string): any;

export interface Props {
  onSucceed: () => void;
  githubData: { owner?: string; name?: string; githubToken?: string };
  webhookData: { webhookUrl: string; data: string };
  visible: boolean;
}

export default class Settings extends React.Component<Props> {
  state = {
    isPushing: false,
    version: "",
    message: "",
    versionTip: "",
    messageTip: "",
    sha: "",
    contents: { version: "0.0.0" },
    currentVersion: "",
    currentVersionTip: "",
    resultTip: "",
    prUrl: "",
    isSending: false,
    webhookData: null,
    test: "",
  };
  getVersion = async (githubData) => {
    const { contents, sha } = await getContent();

    const currentVersion = contents.version;
    this.setState({
      sha,
      contents,
      currentVersion,
      currentVersionTip: `The current version is ${currentVersion}`,
    });
  };
  createBranch = async () => {
    const { githubData } = this.props;
    const { sha } = await getCommit(githubData);
    const { ref } = await createBranch(sha, githubData);
    return { branchName: ref.replace("refs/heads/", "") };
  };
  changeVersion = async (branch) => {
    const { githubData } = this.props;
    const { version, message, contents, sha } = this.state;
    contents.version = version;
    await updatePackage(message, sha, contents, branch, githubData);
  };
  createCommitAndPR = async (branchName) => {
    const { githubData } = this.props;
    const { version, message } = this.state;
    return await createPullRequest(
      `[figma]:update to ${version}`,
      message,
      branchName,
      githubData
    );
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };
  handleWebhookFilled = (webhookUrl, data) => {
    const noData = !webhookUrl && !data;
    this.setState({
      webhookData: noData ? null : { webhookUrl, data },
    });
  };
  validate = (callback) => {
    const { version, message, currentVersion } = this.state;
    // TODO: should validate async
    // this.getVersion(this.props.githubData)
    //   .then(() => {
    //     const { currentVersion } = this.state
    //     currentVersion
    //   })
    if (!version) {
      this.setState({ versionTip: "Version is required." });
      return;
    } else if (!/^[0-9]\d?(\.(0|[1-9]\d?)){2}$/.test(version)) {
      this.setState({ versionTip: "Version should be like 1.17.2." });
      return;
    } else if (versionValue(version) - versionValue(currentVersion) <= 0) {
      this.setState({ versionTip: "Should be bigger than current version." });
      return;
    }
    this.setState({
      versionTip: "",
    });
    if (!message) {
      this.setState({ messageTip: "Commit message is required." });
      return;
    }
    this.setState({
      messageTip: "",
    });
    callback && callback();
  };
  handleSubmit = async () => {
    this.validate(async () => {
      this.setState({ isPushing: true });

      parent.postMessage({ pluginMessage: { type: "extract" } }, "*");

      window.onmessage = async (event) => {
        const { payload } = event.data.pluginMessage;
        const { fileKey, ids, nodes } = payload;

        const { images } = await getSvg({ fileKey, ids });

        // <-- Here (SVG 가져오는 것까지 함)
        // Todo
        // github에 파일 추가하고 PR 올리기 (조아조아)
        const svgs = await Promise.all(
          nodes.map(async ({ id, name }) => {
            console.log(images[id]);

            const response = await fetch(images[id]).then((res) => res.text());
            return response;
          })
        );

        console.log(svgs);

        const blobs = async () => {
          const response = await createSVG(svgs);
          console.log(
            "🚀 ~ file: Updator.tsx:142 ~ Settings ~ blobs ~ response:",
            response
          );
        };

        console.log(blobs());

        // const svgBlobs = await Promise.all(
        //   nodes.map(async ({ id, name }) => {
        //     const response = await createBlob(images[id]);
        //     console.log(
        //       "🚀 ~ file: Updator.tsx:131 ~ Settings ~ svgBlobs ~ response:",
        //       response
        //     );

        //     return name;
        //   })
        // );
        // console.log(
        //   "🚀 ~ file: Updator.tsx:137 ~ Settings ~ window.onmessage= ~ svgBlobs:",
        //   svgBlobs
        // );
      };
    });
  };
  onCancel = () => {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  };
  componentDidUpdate(prevProps) {
    if (!prevProps.githubData && this.props.githubData) {
      this.getVersion(this.props.githubData);
    }
  }
  render() {
    const { visible, webhookData } = this.props;
    const {
      isPushing,
      version,
      message,
      versionTip,
      messageTip,
      currentVersionTip,
      resultTip,
      prUrl,
      webhookData: whd,
      isSending,
      test,
    } = this.state;
    return (
      <div className={"updator " + (!visible ? "hide" : "")}>
        <div className="form-item">
          <span>lalalalala - {test}</span>
          {!resultTip && (
            <p className="type type--pos-medium-normal">
              Please fill the version and commit message below.
            </p>
          )}
          {currentVersionTip && !resultTip && (
            <div className="type type--pos-medium-bold">
              {currentVersionTip}
            </div>
          )}
          {resultTip && (
            <div className="type type--pos-medium-bold alert alert-success">
              <h3>Congratulations!</h3>
              {resultTip}
              <br />
              Click{" "}
              <a href={prUrl} target="_blank">
                here
              </a>{" "}
              to open the PR link.
            </div>
          )}
          {whd && isSending && (
            <p className="type type--pos-medium-normal">
              Sending notification, please wait for a minute……
            </p>
          )}
        </div>
        <div className={"form-item " + (resultTip ? "hide" : "")}>
          <input
            name="version"
            className="input"
            placeholder="The new version, such as 1.17.2"
            onChange={this.handleChange}
            value={version}
          />
          {versionTip && (
            <div className="type type--pos-medium-normal help-tip">
              {versionTip}
            </div>
          )}
        </div>
        <div className={"form-item " + (resultTip ? "hide" : "")}>
          <textarea
            rows={2}
            name="message"
            className="textarea"
            placeholder="what has been changed?"
            onChange={this.handleChange}
            value={message}
          />
          {messageTip && (
            <div className="type type--pos-medium-normal help-tip">
              {messageTip}
            </div>
          )}
        </div>
        <Webhook
          hidden={resultTip}
          onFilled={this.handleWebhookFilled}
          webhookData={webhookData}
        />
        <div className={"form-item " + (resultTip ? "hide" : "")}>
          <button
            onClick={this.handleSubmit}
            className="button button--primary"
            style={{ marginRight: "8px" }}
            disabled={isPushing}>
            {isPushing ? "pushing…" : "push to Github"}
          </button>
          {!isPushing && (
            <button
              onClick={this.onCancel}
              className="button button--secondary">
              close
            </button>
          )}
        </div>
        {resultTip && (
          <button onClick={this.onCancel} className="button button--secondary">
            close
          </button>
        )}
      </div>
    );
  }
}
