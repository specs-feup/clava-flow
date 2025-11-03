import ConditionalEdge from "@specs-feup/clava-flow/cfg/edge/ConditionalEdge";
import BreakNode from "@specs-feup/clava-flow/cfg/node/BreakNode";
import CommentNode from "@specs-feup/clava-flow/cfg/node/CommentNode";
import ContinueNode from "@specs-feup/clava-flow/cfg/node/ContinueNode";
import DoWhileNode from "@specs-feup/clava-flow/cfg/node/condition/DoWhileNode";
import EmptyStatementNode from "@specs-feup/clava-flow/cfg/node/EmptyStatementNode";
import ExpressionNode from "@specs-feup/clava-flow/cfg/node/ExpressionNode";
import ForEachNode from "@specs-feup/clava-flow/cfg/node/condition/ForEachNode";
import ForNode from "@specs-feup/clava-flow/cfg/node/condition/ForNode";
import GotoLabelNode from "@specs-feup/clava-flow/cfg/node/GotoLabelNode";
import GotoNode from "@specs-feup/clava-flow/cfg/node/GotoNode";
import IfNode from "@specs-feup/clava-flow/cfg/node/condition/IfNode";
import PragmaNode from "@specs-feup/clava-flow/cfg/node/PragmaNode";
import ReturnNode from "@specs-feup/clava-flow/cfg/node/ReturnNode";
import ScopeNode from "@specs-feup/clava-flow/cfg/node/ScopeNode";
import VariableDeclarationNode from "@specs-feup/clava-flow/cfg/node/VariableDeclarationNode";
import WhileNode from "@specs-feup/clava-flow/cfg/node/condition/WhileNode";
import ClavaControlFlowNode from "@specs-feup/clava-flow/ClavaControlFlowNode";
import ClavaFlowGraph from "@specs-feup/clava-flow/ClavaFlowGraph";
import ClavaFunctionNode from "@specs-feup/clava-flow/ClavaFunctionNode";
import {
    Break,
    Case,
    Comment,
    Continue,
    DeclStmt,
    EmptyStmt,
    ExprStmt,
    FileJp,
    FunctionJp,
    GotoStmt,
    If,
    Joinpoint,
    LabelDecl,
    LabelStmt,
    Loop,
    Pragma,
    Program,
    ReturnStmt,
    Scope,
    Switch,
    Vardecl,
    WrapperStmt,
    AsmStmt
} from "@specs-feup/clava/api/Joinpoints.js";
import LaraFlowError from "@specs-feup/flow/error/LaraFlowError";
import ControlFlowEdge from "@specs-feup/flow/flow/ControlFlowEdge";
import ControlFlowEndNode from "@specs-feup/flow/flow/ControlFlowEndNode";
import ControlFlowNode from "@specs-feup/flow/flow/ControlFlowNode";
import FlowGraph from "@specs-feup/flow/flow/FlowGraph";
import BaseGraph from "@specs-feup/flow/graph/BaseGraph";
import Graph from "@specs-feup/flow/graph/Graph";
import Node from "@specs-feup/flow/graph/Node";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import AsmStatementNode from "../cfg/node/AsmStatementNode.js";

class SubGraph {
    head: ClavaControlFlowNode.Class | undefined;
    normalTail: ClavaControlFlowNode.Class[];
    falseTail: ClavaControlFlowNode.Class[];
    jumpTail: ClavaControlFlowNode.Class[];
    tailIsFake: boolean;

    constructor(
        head: ClavaControlFlowNode.Class | undefined,
        normalTail: ClavaControlFlowNode.Class[],
        falseTail: ClavaControlFlowNode.Class[] = [],
        jumpTail: ClavaControlFlowNode.Class[] = [],
        tailIsFake: boolean,
    ) {
        this.head = head;
        this.normalTail = normalTail;
        this.falseTail = falseTail;
        this.jumpTail = jumpTail;
        this.tailIsFake = tailIsFake;
    }

    static fromSingle(node: ClavaControlFlowNode.Class): SubGraph {
        return new SubGraph(node, [node], [], [], false);
    }

    static fromSequence(
        head: ClavaControlFlowNode.Class,
        tail: ClavaControlFlowNode.Class,
    ): SubGraph {
        return new SubGraph(head, [tail], [], [], false);
    }

    static fromEmpty(): SubGraph {
        return new SubGraph(undefined, [], [], [], false);
    }

    static fromJump(node: ClavaControlFlowNode.Class): SubGraph {
        return new SubGraph(node, [node], [], [], true);
    }

    static fromBranched(
        head: ClavaControlFlowNode.Class,
        tail: ClavaControlFlowNode.Class[],
        falseTail: ClavaControlFlowNode.Class[] = [],
        jumpTail: ClavaControlFlowNode.Class[] = [],
    ) {
        return new SubGraph(head, tail, falseTail, jumpTail, false);
    }
}

class GeneratorContext {
    #graph: ClavaFlowGraph.Class;
    #fnNode: ClavaFunctionNode.Class;
    #labels: Map<string, ClavaControlFlowNode.Class>;
    #gotos: Map<string, ClavaControlFlowNode.Class[]>;
    #returns: ClavaControlFlowNode.Class[];
    #continueStack: ClavaControlFlowNode.Class[][];
    #breakStack: ClavaControlFlowNode.Class[][];
    // caseNodes?: UnknownInstructionNode.Class[];
    // defaultCase?: UnknownInstructionNode.Class;

    constructor(graph: ClavaFlowGraph.Class, fnNode: ClavaFunctionNode.Class) {
        this.#graph = graph;
        this.#fnNode = fnNode;
        this.#returns = [];
        this.#labels = new Map();
        this.#gotos = new Map();
        this.#continueStack = [];
        this.#breakStack = [];
    }

    addCfgNodeBase(): ControlFlowNode.Class {
        return this.#graph
            .addNode()
            .init(new ControlFlowNode.Builder(this.#fnNode))
            .as(ControlFlowNode);
    }

    addCfgNode(
        builder: Node.Builder<
            ClavaControlFlowNode.Data,
            ClavaControlFlowNode.ScratchData,
            ControlFlowNode.Data,
            ControlFlowNode.ScratchData
        >,
    ): ClavaControlFlowNode.Class {
        return this.addCfgNodeBase().init(builder).as(ClavaControlFlowNode);
    }

    addCfgEdge(
        from: ClavaControlFlowNode.Class,
        to: ControlFlowNode.Class,
    ): ControlFlowEdge.Class {
        return this.#graph
            .addEdge(from, to)
            .init(new ControlFlowEdge.Builder())
            .as(ControlFlowEdge);
    }

    addConditionalEdge(
        from: ClavaControlFlowNode.Class,
        to: ControlFlowNode.Class,
        condition: boolean,
    ): ConditionalEdge.Class {
        return this.#graph
            .addEdge(from, to)
            .init(new ControlFlowEdge.Builder())
            .init(new ConditionalEdge.Builder(condition))
            .as(ConditionalEdge);
    }

    addFakeCfgEdge(
        from: ClavaControlFlowNode.Class,
        to: ControlFlowNode.Class,
    ): ControlFlowEdge.Class {
        return this.#graph
            .addEdge(from, to)
            .init(new ControlFlowEdge.Builder().fake())
            .as(ControlFlowEdge);
    }

    registerReturn(node: ClavaControlFlowNode.Class) {
        this.#returns.push(node);
    }

    get returns(): ClavaControlFlowNode.Class[] {
        return this.#returns;
    }

    registerContinue(node: ClavaControlFlowNode.Class) {
        this.#continueStack.at(this.#continueStack.length - 1)?.push(node);
    }

    registerBreak(node: ClavaControlFlowNode.Class) {
        this.#breakStack.at(this.#breakStack.length - 1)?.push(node);
    }

    pushLoopFrame(loop: Loop) {
        this.#continueStack.push([]);
        this.#breakStack.push([]);
    }

    popLoopFrame() {
        return {
            breaks: this.#breakStack.pop() ?? [],
            continues: this.#continueStack.pop() ?? [],
        };
    }

    pushSwitchFrame() {
        this.#breakStack.push([]);
    }

    popSwitchFrame() {
        return {
            breaks: this.#breakStack.pop() ?? [],
        };
    }

    registerLabelNode(label: string, node: ClavaControlFlowNode.Class) {
        this.#labels.set(label, node);
    }

    getLabelNode(label: string): ClavaControlFlowNode.Class | undefined {
        return this.#labels.get(label);
    }

    registerGotoNode(label: string, node: ClavaControlFlowNode.Class) {
        if (this.#gotos.has(label)) {
            this.#gotos.get(label)!.push(node);
        } else {
            this.#gotos.set(label, [node]);
        }
    }

    getGotoNodes(label: string): ClavaControlFlowNode.Class[] {
        return this.#gotos.get(label) ?? [];
    }

    connectOutwardsJump(from: ClavaControlFlowNode.Class, to: ControlFlowNode.Class) {
        let exitNode: ClavaControlFlowNode.Class = from;
        let currentJp = from.jp;

        let target = to.tryAs(ClavaControlFlowNode)?.jp;
        while (target !== undefined && !(target instanceof Scope)) {
            target = target.parent;
        }

        while (currentJp?.astId !== target?.astId) {
            if (currentJp instanceof FunctionJp) {
                break;
            }
            if (currentJp instanceof Scope) {
                const endScope = this.addCfgNode(
                    new ScopeNode.Builder(
                        currentJp,
                        ScopeNode.Direction.EXITING,
                        ScopeNode.ControlFlowKind.JUMP,
                    ),
                );
                this.addCfgEdge(exitNode, endScope);
                exitNode = endScope;
            }

            currentJp = currentJp.parent;
        }

        this.addCfgEdge(exitNode, to);
    }

    connectArbitraryJump(
        from: ClavaControlFlowNode.Class,
        to: ClavaControlFlowNode.Class,
    ) {
        const fromScopes = this.#getScopeList(from.jp);
        const toScopes = this.#getScopeList(to.jp);
        let fromScopesIdx = fromScopes.length - 1;
        let toScopesIdx = toScopes.length - 1;

        while (
            toScopesIdx >= 0 &&
            fromScopesIdx >= 0 &&
            toScopes[toScopesIdx].astId === fromScopes[fromScopesIdx].astId
        ) {
            toScopesIdx--;
            fromScopesIdx--;
        }

        let exitNode: ClavaControlFlowNode.Class = from;

        for (let i = 0; i <= fromScopesIdx; i++) {
            const endScope = this.addCfgNode(
                new ScopeNode.Builder(
                    fromScopes[i],
                    ScopeNode.Direction.EXITING,
                    ScopeNode.ControlFlowKind.JUMP,
                ),
            );
            this.addCfgEdge(exitNode, endScope);
            exitNode = endScope;
        }

        for (let i = toScopesIdx; i >= 0; i--) {
            const startScope = this.addCfgNode(
                new ScopeNode.Builder(
                    toScopes[i],
                    ScopeNode.Direction.ENTERING,
                    ScopeNode.ControlFlowKind.JUMP,
                ),
            );
            this.addCfgEdge(exitNode, startScope);
            exitNode = startScope;
        }

        this.addCfgEdge(exitNode, to);
    }

    #getScopeList(jp: Joinpoint): Scope[] {
        const result: Scope[] = [];

        if (jp instanceof LabelDecl) {
            jp = jp.labelStmt;
        }

        while (true) {
            if (jp instanceof Scope) {
                result.push(jp);
            }
            if (jp.hasParent) {
                jp = jp.parent;
            } else {
                break;
            }
        }

        return result;
    }
}

export default class ClavaCfgGenerator
    implements Graph.Transformation<BaseGraph.Class, ClavaFlowGraph.Class> {
    #jps: (Program | FileJp | FunctionJp)[];

    constructor(...jps: (Program | FileJp | FunctionJp)[]) {
        this.#jps = jps;
    }

    apply(graph: BaseGraph.Class): ClavaFlowGraph.Class {
        // Initializes graph type only if necessary
        let cgraph: ClavaFlowGraph.Class;
        if (graph.is(ClavaFlowGraph)) {
            cgraph = graph.as(ClavaFlowGraph);
        } else {
            let fgraph: FlowGraph.Class;
            if (graph.is(FlowGraph)) {
                fgraph = graph.as(FlowGraph);
            } else {
                fgraph = graph.init(new FlowGraph.Builder()).as(FlowGraph);
            }
            cgraph = fgraph.init(new ClavaFlowGraph.Builder()).as(ClavaFlowGraph);
        }

        // Process all function implementations inside Programs and FileJps
        // Only process a FunctionJp if it is an implementation (and ignore nested functions)
        for (const jp of this.#jps) {
            if (jp instanceof Program || jp instanceof FileJp) {
                for (const fn of Query.searchFrom(jp, FunctionJp, fn => fn.isImplementation)) {
                    this.#processFunction(cgraph, fn);
                }
            } else if (jp instanceof FunctionJp) {
                if (!jp.isImplementation) {
                    throw new LaraFlowError(
                        "Cannot build graph for function without implementation",
                    );
                }
                this.#processFunction(cgraph, jp);
            }
        }

        return cgraph;
    }

    #processFunction(graph: ClavaFlowGraph.Class, fn: FunctionJp): void {
        // Reuse existing function node if it already exists
        const fnNode = graph.getOrAddFunction(fn);

        // CFG Nodes will be overwriten
        // TODO maybe configurable? (ERROR | KEEP | OVERWRITE) (default: ERROR)
        if (fnNode.controlFlowNodes.length > 0) {
            throw new LaraFlowError(
                "Function already has control flow nodes; cannot overwrite",
            );
        }
        // for (const node of fnNode.controlFlowNodes) {
        //     node.remove();
        // }

        const ctx = new GeneratorContext(graph, fnNode);
        const body = this.#processScope(fn.body, ctx);
        fnNode.cfgEntryNode = body.head!;

        const endNode = graph
            .addNode()
            .init(new ControlFlowEndNode.Builder(fnNode))
            .as(ControlFlowEndNode);

        for (const returnTail of ctx.returns) {
            ctx.connectOutwardsJump(returnTail, endNode);
        }
        ctx.addCfgEdge(body.normalTail[0], endNode);
    }

    #processScope(jp: Scope, ctx: GeneratorContext): SubGraph {
        const scopeStart = ctx.addCfgNode(
            new ScopeNode.Builder(
                jp,
                ScopeNode.Direction.ENTERING,
                ScopeNode.ControlFlowKind.NORMAL,
            ),
        );

        let current: SubGraph = SubGraph.fromSingle(scopeStart);
        for (const child of jp.children) {
            const processedChild = this.#processJp(child, ctx);
            if (processedChild.head === undefined) {
                continue;
            }

            for (const tailNode of current.normalTail) {
                if (current.tailIsFake) {
                    ctx.addFakeCfgEdge(tailNode, processedChild.head);
                } else {
                    ctx.addCfgEdge(tailNode, processedChild.head);
                }
            }
            for (const tailNode of current.jumpTail) {
                ctx.connectOutwardsJump(tailNode, processedChild.head);
            }
            for (const tailNode of current.falseTail) {
                ctx.addConditionalEdge(tailNode, processedChild.head, false);
            }
            current = processedChild;
        }

        const scopeEnd = ctx.addCfgNode(
            new ScopeNode.Builder(
                jp,
                ScopeNode.Direction.EXITING,
                ScopeNode.ControlFlowKind.NORMAL,
            ),
        );

        for (const tailNode of current.normalTail) {
            if (current.tailIsFake) {
                ctx.addFakeCfgEdge(tailNode, scopeEnd);
            } else {
                ctx.addCfgEdge(tailNode, scopeEnd);
            }
        }
        for (const tailNode of current.jumpTail) {
            ctx.connectOutwardsJump(tailNode, scopeEnd);
        }
        for (const tailNode of current.falseTail) {
            ctx.addConditionalEdge(tailNode, scopeEnd, false);
        }

        return SubGraph.fromSequence(scopeStart, scopeEnd);
    }

    #processJp(jp: Joinpoint, ctx: GeneratorContext): SubGraph {
        if (jp instanceof Scope) {
            return this.#processScope(jp, ctx);
        } else if (jp instanceof WrapperStmt) {
            if (jp.kind === "comment") {
                const node = ctx.addCfgNode(
                    new CommentNode.Builder(jp.content as Comment),
                );
                return SubGraph.fromSingle(node);
            } else if (jp.kind === "pragma") {
                const node = ctx.addCfgNode(new PragmaNode.Builder(jp.content as Pragma));
                return SubGraph.fromSingle(node);
            }
        } else if (jp instanceof DeclStmt) {
            return this.#processVarDecl(jp, ctx);
        } else if (jp instanceof EmptyStmt) {
            const node = ctx.addCfgNode(new EmptyStatementNode.Builder(jp));
            return SubGraph.fromSingle(node);
        } else if (jp instanceof ExprStmt) {
            const node = ctx.addCfgNode(new ExpressionNode.Builder(jp.expr));
            return SubGraph.fromSingle(node);
        } else if (jp instanceof If) {
            return this.#processIf(jp, ctx);
        } else if (jp instanceof Loop) {
            return this.#processLoop(jp, ctx);
        } else if (jp instanceof Switch) {
            return this.#processSwitch(jp, ctx);
        } else if (jp instanceof Case) {
            // TODO implement
            throw new Error("Not implemented");
            // // Case nodes will be processed by the Switch
            // // Marking them as a temporary is enough
            // const node = this.#createTemporaryNode(jp);
            // if (jp.isDefault) {
            //     ctx.defaultCase = node;
            // } else {
            //     ctx.caseNodes?.push(node);
            // }
            // return [node, node];
        } else if (jp instanceof ReturnStmt) {
            const node = ctx.addCfgNode(new ReturnNode.Builder(jp));
            ctx.registerReturn(node);
            return SubGraph.fromJump(node);
        } else if (jp instanceof Break) {
            const node = ctx.addCfgNode(new BreakNode.Builder(jp));
            ctx.registerBreak(node);
            return SubGraph.fromJump(node);
        } else if (jp instanceof Continue) {
            const node = ctx.addCfgNode(new ContinueNode.Builder(jp));
            ctx.registerContinue(node);
            return SubGraph.fromJump(node);
        } else if (jp instanceof LabelStmt) {
            return this.#processLabel(jp.decl, ctx);
        } else if (jp instanceof GotoStmt) {
            return this.#processGoto(jp, ctx);
        } else if (jp instanceof AsmStmt) {
            const node = ctx.addCfgNode(new AsmStatementNode.Builder(jp));
            return SubGraph.fromSingle(node);
        }

        throw new Error("Unsupported joinpoint type " + jp.joinPointType);
    }

    #processVarDecl($jp: DeclStmt, ctx: GeneratorContext): SubGraph {
        let head: ClavaControlFlowNode.Class | undefined;
        let tail: ClavaControlFlowNode.Class | undefined;

        for (const $decl of $jp.decls) {
            if ($decl instanceof Vardecl && !$decl.isGlobal) {
                const node = ctx.addCfgNode(new VariableDeclarationNode.Builder($decl));

                if (head === undefined) {
                    head = node;
                }

                if (tail !== undefined) {
                    ctx.addCfgEdge(tail, node);
                }

                tail = node;
            }
        }

        if (head === undefined) {
            return SubGraph.fromEmpty();
        }

        return SubGraph.fromSequence(head, tail!);
    }

    #processIf($jp: If, ctx: GeneratorContext): SubGraph {
        const $iftrue = $jp.then as Scope;
        // Type conversion necessary because the return type of clava is incorrect
        const $iffalse = $jp.else as Scope | undefined;

        const conditionNode = ctx.addCfgNode(new IfNode.Builder($jp));
        const ifTrueSubgraph = this.#processScope($iftrue, ctx);
        ctx.addConditionalEdge(conditionNode, ifTrueSubgraph.head!, true);

        let elseTail: ClavaControlFlowNode.Class[] = [];
        const falseTail = $iffalse === undefined ? [conditionNode] : [];
        if ($iffalse !== undefined) {
            const ifFalseSubgraph = this.#processScope($iffalse, ctx);
            ctx.addConditionalEdge(conditionNode, ifFalseSubgraph.head!, false);
            elseTail = ifFalseSubgraph.normalTail;
        }

        return SubGraph.fromBranched(
            conditionNode,
            elseTail.concat(ifTrueSubgraph.normalTail),
            falseTail,
        );
    }

    #processLoop($jp: Loop, ctx: GeneratorContext): SubGraph {
        // TODO should there be an extra scope around the for? because of vardecls inside init
        //      that is, loop itself must be a scope
        let init: SubGraph | undefined;
        let step: SubGraph | undefined;
        let uninitConditionNode: ControlFlowNode.Class | undefined;

        if ($jp.kind === "for" && $jp.init !== undefined) {
            init = this.#processJp($jp.init, ctx);
        }

        if ($jp.kind !== "dowhile") {
            uninitConditionNode = ctx.addCfgNodeBase();
        }

        ctx.pushLoopFrame($jp);
        const body = this.#processScope($jp.body, ctx);
        const { breaks, continues } = ctx.popLoopFrame();

        if ($jp.kind === "while") {
            uninitConditionNode!.init(new WhileNode.Builder($jp));
        } else if ($jp.kind === "dowhile") {
            // Only scenario where conditionNode is not defined
            uninitConditionNode = ctx.addCfgNode(new DoWhileNode.Builder($jp));
        } else if ($jp.kind === "for") {
            if ($jp.step !== undefined) {
                step = this.#processJp($jp.step, ctx);
            }
            // TODO add init and step to ForNode
            uninitConditionNode!.init(new ForNode.Builder($jp));
        } else if ($jp.kind === "foreach") {
            // TODO fix the whole for-each thing
            uninitConditionNode!.init(new ForEachNode.Builder($jp));
        }

        const conditionNode = uninitConditionNode!.expect(
            ClavaControlFlowNode,
            "All four cases initialize with a subtype of ClavaControlFlowNode",
        );

        ctx.addConditionalEdge(conditionNode, body.head!, true);

        const continueTarget =
            $jp.kind === "for" && step !== undefined && step.head !== undefined ? step.head : conditionNode;

        for (const bodyTailNode of body.normalTail) {
            ctx.addCfgEdge(bodyTailNode, continueTarget);
        }

        for (const continueNode of continues) {
            ctx.connectOutwardsJump(continueNode, continueTarget);
        }

        if ($jp.kind === "for") {
            if (step !== undefined) {
                for (const stepTailNode of step.normalTail) {
                    ctx.addCfgEdge(stepTailNode, conditionNode);
                }

            }

            if (init !== undefined) {
                for (const initTailNode of init.normalTail) {
                    ctx.addCfgEdge(initTailNode, conditionNode);
                }
            }
        }

        let head: ClavaControlFlowNode.Class;
        if ($jp.kind === "dowhile") {
            head = body.head!;
        } else if ($jp.kind === "for" && init !== undefined && init.head !== undefined) {
            head = init.head;
        } else {
            head = conditionNode;
        }

        return SubGraph.fromBranched(head, [], [conditionNode!], breaks);
    }

    #processSwitch($jp: Switch, ctx: GeneratorContext): SubGraph {
        // TODO implement
        throw new Error("Not implemented");
        // const $body = $jp.getChild(1);
        // if (!($body instanceof Scope)) {
        //     throw new Error("Switch body must be a scope");
        // }
        // const breakNode = this.#createTemporaryNode($body);
        // const caseNodes: ClavaControlFlowNode.Class[] = [];
        // const innerContext = { ...ctx, breakNode, caseNodes };
        // const [bodyHead, bodyTail] = this.#processScope($body, innerContext);
        // const defaultCase = innerContext.defaultCase;

        // const node = ctx.addCfgNode()
        //     .init(new SwitchNode.Builder($jp))
        //     .as(SwitchNode.Class);

        // bodyHead.insertBefore(node);

        // let previousCase: ConditionNode.Class | undefined = undefined;
        // for (const tempCaseNode of caseNodes) {
        //     const currentCase = this.#graph.addCondition(
        //         tempCaseNode.jp as Case,
        //         tempCaseNode.nextNode!,
        //         tempCaseNode, // False node doesn't matter for now, since it will change
        //     );

        //     if (previousCase === undefined) {
        //         bodyHead.nextNode = currentCase;
        //     } else {
        //         previousCase.falseNode = currentCase;
        //     }

        //     for (const incomer of tempCaseNode.incomers) {
        //         incomer.target = tempCaseNode.nextNode!;
        //     }

        //     previousCase = currentCase;
        // }

        // if (defaultCase !== undefined) {
        //     const currentCase = this.#graph.addCondition(
        //         defaultCase.jp as Case,
        //         defaultCase.nextNode!,
        //         defaultCase, // False node doesn't matter for now, since it will change
        //     );

        //     if (previousCase === undefined) {
        //         bodyHead.nextNode = currentCase;
        //     } else {
        //         previousCase.falseNode = currentCase;
        //     }

        //     for (const incomer of defaultCase.incomers) {
        //         incomer.target = defaultCase.nextNode!;
        //     }

        //     previousCase = currentCase;
        // }

        // let scopeEnd = bodyTail;
        // if (scopeEnd === undefined) {
        //     if (breakNode.incomers.length === 0) {
        //         return [node];
        //     }

        //     scopeEnd = this.#graph
        //         .addNode()
        //         .init(new ScopeEndNode.Builder($body, ScopeEndNode.Kind.BROKEN_FLOW))
        //         .as(ScopeEndNode.Class);

        //     breakNode.nextNode = scopeEnd;
        // }

        // scopeEnd.insertBefore(breakNode);

        // if (previousCase === undefined) {
        //     bodyHead.nextNode = scopeEnd;
        // } else {
        //     previousCase.falseNode = scopeEnd;
        // }

        // return [node, scopeEnd];
    }

    #processLabel(jp: LabelDecl, ctx: GeneratorContext): SubGraph {
        const node = ctx.addCfgNode(new GotoLabelNode.Builder(jp));

        ctx.registerLabelNode(jp.name, node);
        const gotos = ctx.getGotoNodes(jp.name);
        for (const goto of gotos) {
            ctx.connectArbitraryJump(goto, node);
        }

        return SubGraph.fromSingle(node);
    }

    #processGoto(jp: GotoStmt, ctx: GeneratorContext): SubGraph {
        const node = ctx.addCfgNode(new GotoNode.Builder(jp));

        ctx.registerGotoNode(jp.label.name, node);
        const label = ctx.getLabelNode(jp.label.name);
        if (label !== undefined) {
            ctx.connectArbitraryJump(node, label);
        }

        return SubGraph.fromJump(node);
    }
}
