import { registerSourceCode } from "@specs-feup/lara/jest/jestHelpers.js";
import { FunctionJp, Program } from "@specs-feup/clava/api/Joinpoints.js";
import Graph from "@specs-feup/flow/graph/Graph";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import ConditionalEdge from "@specs-feup/clava-flow/cfg/edge/ConditionalEdge";
import IfNode from "@specs-feup/clava-flow/cfg/node/condition/IfNode";
import ReturnNode from "@specs-feup/clava-flow/cfg/node/ReturnNode";
import ClavaFlowDotFormatter from "@specs-feup/clava-flow/dot/ClavaFlowDotFormatter";
import ClavaFlowGraph from "@specs-feup/clava-flow/ClavaFlowGraph";
import ClavaCfgGenerator from "@specs-feup/clava-flow/transformation/ClavaCfgGenerator";

const source = `
int choose(int value) {
    if (value != 0) {
        value += 1;
    } else {
        value -= 1;
    }

    return value;
}
`;

describe("ClavaCfgGenerator", () => {
    registerSourceCode(source);

    function buildGraph() {
        return Graph.create().apply(new ClavaCfgGenerator(Query.root() as Program));
    }

    test("builds a typed control-flow graph for a Clava function", () => {
        const functionJp = Query.search(FunctionJp, { name: "choose" }).first();
        const graph = buildGraph();

        expect(graph.is(ClavaFlowGraph)).toBe(true);
        expect(functionJp).toBeDefined();

        const functionNode = graph.getFunction(functionJp!);
        expect(functionNode).toBeDefined();
        expect(functionNode!.jp.astId).toBe(functionJp!.canonical.astId);
        expect(functionNode!.cfgEntryNode).toBeDefined();
        expect(functionNode!.controlFlowNodes.filterIs(IfNode)).toHaveLength(1);
        expect(functionNode!.controlFlowNodes.filterIs(ReturnNode)).toHaveLength(1);
    });

    test("represents both outcomes of a branch with conditional edges", () => {
        const graph = buildGraph();
        const ifNode = graph.nodes.filterIs(IfNode)[0];
        const conditionalEdges = ifNode.outgoers.filterIs(ConditionalEdge);

        expect(conditionalEdges).toHaveLength(2);
        expect(conditionalEdges.some((edge) => edge.executesIfTrue)).toBe(true);
        expect(conditionalEdges.some((edge) => edge.executesIfFalse)).toBe(true);
    });

    test("formats branch nodes and edges with control-flow information", () => {
        const graph = buildGraph();
        const ifNode = graph.nodes.filterIs(IfNode)[0];
        const conditionalEdges = ifNode.outgoers.filterIs(ConditionalEdge);
        const trueEdge = conditionalEdges.filter((edge) => edge.executesIfTrue)[0];
        const falseEdge = conditionalEdges.filter((edge) => edge.executesIfFalse)[0];

        const nodeAttrs = ClavaFlowDotFormatter.defaultGetNodeAttrs(ifNode);
        expect(nodeAttrs.label).toContain(">if</FONT>");
        expect(nodeAttrs.label).toContain("value != 0");
        expect(ClavaFlowDotFormatter.defaultGetEdgeAttrs(trueEdge).color).toBe(
            ClavaFlowDotFormatter.trueColor,
        );
        expect(ClavaFlowDotFormatter.defaultGetEdgeAttrs(falseEdge).color).toBe(
            ClavaFlowDotFormatter.falseColor,
        );
    });

    test("rejects regenerating control-flow nodes for the same function", () => {
        const graph = buildGraph();
        const functionJp = Query.search(FunctionJp, { name: "choose" }).first()!;

        expect(() => graph.apply(new ClavaCfgGenerator(functionJp))).toThrow(
            "Function already has control flow nodes",
        );
    });
});
