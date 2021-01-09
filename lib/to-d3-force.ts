import { Node, Parent } from "unist";
import { compact } from "./unist-compact";

type Link = {
  source: string;
  target: string;
  value: string;
};

type ForceData = {
  nodes: Node[];
  links: Link[];
};

export function toD3Force(root: Parent): ForceData {
  const compacted = compact(root);
  const nodes = compacted.children;

  const index = new Set<string>(
    nodes.map((child) => child.data?.xref_id as string).filter(Boolean)
  );

  const links: Link[] = [];
  const linkIndex = new Map<string, Link[]>();

  nodes.forEach((node) => {
    if (!node.data) return;
    Object.entries(node.data)
      .filter(([key, _]) => key.startsWith("@"))
      .forEach(([key, value]) => {
        if (!index.has(value as string)) {
          throw new Error(`Undefined reference: ${value}`);
        }
        if (!node.data?.xref_id) {
          throw new Error(`Link from node with no xref id`);
        }
        const source = node.data?.xref_id as string;
        const target = value as string;
        const link = {
          source,
          target,
          value: key,
        };
        links.push(link);
        const idxKey = [source, target].sort().join("/");
        if (!linkIndex.has(idxKey)) {
          linkIndex.set(idxKey, [link]);
        } else {
          linkIndex.get(idxKey)!.push(link);
        }
      });
  });

  const pairs = [
    ["@HUSBAND", "@FAMILY_SPOUSE"],
    ["@WIFE", "@FAMILY_SPOUSE"],
    ["@FAMILY_CHILD", "@CHILD"],
  ];

  for (let [_, group] of linkIndex) {
    pairs.forEach((pair) => {
      const [a, b] = pair.map((key) => group.find((elem) => elem.value == key));
      if (a && b) {
        links.splice(links.indexOf(a), 1);
      }
    });
  }

  return {
    nodes,
    links,
  };
}