import * as fs from "fs";
import * as path from "path";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid"; // Install uuid package if not already installed
import loggerInstance from "./loggingService";
import { get } from "../config/env.config";

export const newCreateCloudFormationDeploy = async (
  apiGatewayName: string,
  domain: string
) => {
  try {
    // Generate a unique stack name using UUID
    const stackName = `dynamic-stack-${uuidv4()}`;

    // Read the CloudFormation JSON file
    const templateFilePath = path.resolve("cloudformation.json");
    const templateBody = fs.readFileSync(templateFilePath, "utf-8"); // Read template as string

    console.log("aws config region", get("AWS_CODE_HOSTED_REGION"));
    // Initialize CloudFormation client
    const cloudFormation = new AWS.CloudFormation({
      region: get("AWS_CODE_HOSTED_REGION"),
      credentials: new AWS.SharedIniFileCredentials({ profile: "mai" }), // Use 'mai' profile
    });

    // Parameters for stack creation
    const params: AWS.CloudFormation.CreateStackInput = {
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: [
        {
          ParameterKey: "ALBDNSName",
          ParameterValue: "Unity-506123267.ap-south-1.elb.amazonaws.com", // Replace with actual value
        },
        {
          ParameterKey: "EC2InstanceName",
          ParameterValue: "HOP_QA_Network_EC2", // Replace with actual value
        },
        {
          ParameterKey: "DomainName",
          ParameterValue: "cft-test-network.mayaaverse.in", // Replace with actual value
        },
      ],
      Capabilities: [
        "CAPABILITY_IAM",
        "CAPABILITY_NAMED_IAM",
        "CAPABILITY_AUTO_EXPAND",
      ],
      OnFailure: "ROLLBACK",
    };

    // Create the stack
    loggerInstance.log(`Creating stack: ${stackName}`);
    await cloudFormation.createStack(params).promise();

    // Wait for stack creation to complete
    loggerInstance.log(`Waiting for stack creation to complete: ${stackName}`);
    await cloudFormation
      .waitFor("stackCreateComplete", { StackName: stackName })
      .promise();

    // Retrieve the outputs from the stack
    const describeResult = await cloudFormation
      .describeStacks({ StackName: stackName })
      .promise();
    const outputs = describeResult.Stacks[0].Outputs;

    // Extract the API Gateway URL (or any other output)
    const instanceUrl = outputs?.find(
      (output) => output.OutputKey === "ApiGatewayUrl"
    )?.OutputValue;

    loggerInstance.log(
      `Stack created successfully. Instance URL: ${instanceUrl}`
    );
    return instanceUrl;
  } catch (error) {
    loggerInstance.error("Error while creating CloudFormation stack", error);
    throw error;
  }
};
