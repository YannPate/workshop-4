import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

export type Node = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};
export const NodesRegistered:Node[]=[];

export async function launchRegistry() {

  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  // TODO implement the status route
  // _registry.get("/status", (req, res) => {});
  _registry.get("/status", (req, res) => {
    res.send("live")
  });

  _registry.get("/getPrivateKey", (req, res) => {
    res.send({result:req.body.privateKey})
  });

  _registry.get("/getNodeRegistry", (req, res) => {
    const response: GetNodeRegistryBody = { nodes: NodesRegistered };
    res.json(response);
  });



  _registry.post("/registerNode", async (req, res) => {
    const { nodeId, pubKey } = req.body;
  
    // Validate nodeId and pubKey
    if (typeof nodeId !== "number" || typeof pubKey !== "string") {
      return res.status(400).json({ error: "Invalid node data" });
    }
  
    // Validate public key format (must be 392 characters, Base64-like)
    if (!/^[A-Za-z0-9+/]{392}$/.test(pubKey)) {
      return res.status(400).json({ error: "Invalid public key format" });
    }
  
    // Prevent duplicate nodeId
    if (NodesRegistered.some((node) => node.nodeId === nodeId)) {
      return res.status(409).json({ error: "Node ID already registered" });
    }
  
    // Prevent duplicate pubKey
    if (NodesRegistered.some((node) => node.pubKey === pubKey)) {
      return res.status(409).json({ error: "Public key already in use" });
    }
  
    // Register the node
    const node: Node = { nodeId, pubKey };
    NodesRegistered.push(node);
  
    return res.status(201).json({ message: "Node registered", node });
  });


  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}