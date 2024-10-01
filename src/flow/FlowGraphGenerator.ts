import FlowGraph from "clava-flow/flow/FlowGraph";
import {
    FunctionJp,
    Joinpoint,
    Program,
    FileJp,
    Scope,
    WrapperStmt,
    DeclStmt,
    EmptyStmt,
    ExprStmt,
    If,
    Loop,
    Switch,
    Case,
    ReturnStmt,
    Break,
    Continue,
    GotoStmt,
    LabelStmt,
    Comment,
    Pragma,
    Vardecl,
} from "@specs-feup/clava/api/Joinpoints.js";
import Query from "@specs-feup/lara/api/weaver/Query.js";
import UnknownInstructionNode from "clava-flow/flow/node/instruction/UnknownInstructionNode";
import CommentNode from "clava-flow/flow/node/instruction/CommentNode";
import FlowNode from "clava-flow/flow/node/FlowNode";
import ConditionNode from "clava-flow/flow/node/condition/ConditionNode";
import ScopeStartNode from "clava-flow/flow/node/instruction/ScopeStartNode";
import InstructionNode from "clava-flow/flow/node/instruction/InstructionNode";
import ScopeEndNode from "clava-flow/flow/node/instruction/ScopeEndNode";
import FunctionEntryNode from "clava-flow/flow/node/instruction/FunctionEntryNode";
import FunctionExitNode from "clava-flow/flow/node/instruction/FunctionExitNode";
import { NodeBuilder } from "clava-flow/graph/Node";
import PragmaNode from "clava-flow/flow/node/instruction/PragmaNode";
import VarDeclarationNode from "clava-flow/flow/node/instruction/VarDeclarationNode";
import EmptyStatementNode from "clava-flow/flow/node/instruction/EmptyStatementNode";
import ExpressionNode from "clava-flow/flow/node/instruction/ExpressionNode";
import ReturnNode from "clava-flow/flow/node/instruction/ReturnNode";
import BreakNode from "clava-flow/flow/node/instruction/BreakNode";
import ContinueNode from "clava-flow/flow/node/instruction/ContinueNode";
import SwitchNode from "clava-flow/flow/node/instruction/SwitchNode";
import GotoLabelNode from "clava-flow/flow/node/instruction/GotoLabelNode";
import GotoNode from "clava-flow/flow/node/instruction/GotoNode";


// TODO make this a GraphTransformation
export default class FlowGraphGenerator {
    #$jp: Joinpoint;
    #graph: FlowGraph.Class;
    #temporaryNodes: UnknownInstructionNode.Class[];

    constructor($jp: Program | FileJp | FunctionJp, graph: FlowGraph.Class) {
        this.#$jp = $jp;
        this.#graph = graph;
        this.#temporaryNodes = [];
    }

    build(): FlowGraph.Class {
        if (this.#$jp instanceof Program || this.#$jp instanceof FileJp) {
            for (const $function of Query.searchFrom(this.#$jp, "function", {
                isImplementation: true,
            })) {
                this.#processFunction($function as FunctionJp);
            }
        } else if (this.#$jp instanceof FunctionJp) {
            if (!this.#$jp.isImplementation) {
                throw new Error("Cannot build graph for function without implementation");
            }
            this.#processFunction(this.#$jp);
        }

        for (const node of this.#temporaryNodes) {
            node.removeFromFlow();
            node.remove();
        }

        return this.#graph;
    }

    #processJp(
        $jp: Joinpoint,
        context: ProcessJpContext,
    ): [FlowNode.Class, InstructionNode.Class?] {
        if ($jp instanceof FunctionJp) {
            return this.#processFunction($jp);
        } else if ($jp instanceof Scope) {
            return this.#processScope($jp, context);
        } else if ($jp instanceof WrapperStmt) {
            if ($jp.kind === "comment") {
                return this.#addInstruction(
                    new CommentNode.Builder($jp.content as Comment),
                );
            } else if ($jp.kind === "pragma") {
                return this.#addInstruction(
                    new PragmaNode.Builder($jp.content as Pragma),
                );
            } else {
                throw new Error(
                    `Cannot build graph for "${$jp.joinPointType}:${$jp.kind}"`,
                );
            }
        } else if ($jp instanceof DeclStmt) {
            return this.#processVarDecl($jp);
        } else if ($jp instanceof EmptyStmt) {
            return this.#addInstruction(new EmptyStatementNode.Builder($jp));
        } else if ($jp instanceof ExprStmt) {
            return this.#addInstruction(new ExpressionNode.Builder($jp.expr));
        } else if ($jp instanceof If) {
            return this.#processIf($jp, context);
        } else if ($jp instanceof Loop) {
            return this.#processLoop($jp, context);
        } else if ($jp instanceof Switch) {
            return this.#processSwitch($jp, context);
        } else if ($jp instanceof Case) {
            // Case nodes will be processed by the Switch
            // Marking them as a temporary is enough
            const node = this.#createTemporaryNode($jp);
            if ($jp.isDefault) {
                context.defaultCase = node;
            } else {
                context.caseNodes?.push(node);
            }
            return [node, node];
        } else if ($jp instanceof ReturnStmt) {
            return this.#addOutwardsJump(
                new ReturnNode.Builder($jp),
                context.returnNode!,
            );
        } else if ($jp instanceof Break) {
            return this.#addOutwardsJump(new BreakNode.Builder($jp), context.breakNode!);
        } else if ($jp instanceof Continue) {
            return this.#addOutwardsJump(
                new ContinueNode.Builder($jp),
                context.continueNode!,
            );
        } else if ($jp instanceof LabelStmt) {
            return this.#processLabelStmt($jp, context);
        } else if ($jp instanceof GotoStmt) {
            return this.#processGoto($jp, context);
        } else {
            // TODO maybe be silent when inside recursive calls?
            throw new Error(`Cannot build graph for joinpoint "${$jp.joinPointType}"`);
        }
    }

    #processFunction(
        $jp: FunctionJp,
    ): [FunctionEntryNode.Class, FunctionExitNode.Class?] {
        const returnNode = this.#createTemporaryNode($jp);
        const params = $jp.params.map(($p) =>
            this.#graph
                .addNode()
                .init(new VarDeclarationNode.Builder($p))
                .as(VarDeclarationNode.Class),
        );
        const [bodyHead, bodyTail] = this.#processScope($jp.body, {
            labels: new Map(),
            gotos: new Map(),
            returnNode,
        });

        let functionTail: InstructionNode.Class[] = [];
        if (bodyTail !== undefined) {
            returnNode.insertBefore(bodyTail);
            functionTail = [returnNode];
        } else if (returnNode.incomers.length > 0) {
            functionTail = [returnNode];
        }

        return this.#graph.addFunction($jp, bodyHead, functionTail, params);
    }

    #processScope(
        $jp: Scope,
        context: ProcessJpContext,
    ): [ScopeStartNode.Class, ScopeEndNode.Class?] {
        const subGraphs = $jp.children.map((child) => {
            const [head, tail] = this.#processJp(child, context);
            return [head, tail ? [tail] : []] as [
                FlowNode.Class,
                InstructionNode.Class[],
            ];
        });
        return this.#graph.addScope($jp, subGraphs);
    }

    #processVarDecl($jp: DeclStmt): [VarDeclarationNode.Class, VarDeclarationNode.Class] {
        if ($jp.decls.length === 0) {
            throw new Error("Empty declaration statement");
        }

        let head: VarDeclarationNode.Class | undefined;
        let tail: VarDeclarationNode.Class | undefined;

        for (const $decl of $jp.decls) {
            if ($decl instanceof Vardecl) {
                const node = this.#graph
                    .addNode()
                    .init(new VarDeclarationNode.Builder($decl))
                    .as(VarDeclarationNode.Class);

                if (head === undefined) {
                    head = node;
                }

                if (tail !== undefined) {
                    tail.nextNode = node;
                }

                tail = node;
            } else {
                throw new Error("Unsupported declaration type " + $decl.joinPointType);
            }
        }

        return [head!, tail!];
    }

    #processIf(
        $jp: If,
        context: ProcessJpContext,
    ): [ConditionNode.Class, InstructionNode.Class?] {
        const $iftrue = $jp.then as Scope;
        // Type conversion necessary because the return type of clava is incorrect
        const $iffalse = $jp.else as Scope | undefined;

        const [ifTrueHead, iftrueTail] = this.#processScope($iftrue, context);

        let ifFalseHead: FlowNode.Class;
        let ifFalseTail: InstructionNode.Class | undefined;
        if ($iffalse !== undefined) {
            [ifFalseHead, ifFalseTail] = this.#processScope($iffalse, context);
        } else {
            const falseNode = this.#createTemporaryNode();
            [ifFalseHead, ifFalseTail] = [falseNode, falseNode];
        }

        const node = this.#graph.addCondition($jp, ifTrueHead, ifFalseHead);

        if (iftrueTail === undefined && ifFalseTail === undefined) {
            return [node];
        }

        const endIf = this.#createTemporaryNode($jp);

        if (iftrueTail !== undefined) {
            iftrueTail.nextNode = endIf;
        }

        if (ifFalseTail !== undefined) {
            ifFalseTail.nextNode = endIf;
        }

        return [node, endIf];
    }

    #processLoop(
        $jp: Loop,
        context: ProcessJpContext,
    ): [FlowNode.Class, InstructionNode.Class] {
        const continueNode = this.#createTemporaryNode($jp);
        const breakNode = this.#createTemporaryNode($jp);
        const [bodyHead, bodyTail] = this.#processScope($jp.body, {
            ...context,
            breakNode,
            continueNode,
        });

        const node = this.#graph.addLoop(
            $jp,
            bodyHead,
            bodyTail ? [bodyTail] : [],
            breakNode,
        );

        let head: FlowNode.Class;
        if ($jp.kind === "for") {
            const [, init] = this.#processJp($jp.init, context);
            const [, step] = this.#processJp($jp.step, context);

            if (init === undefined) {
                throw new Error("Init must be an instruction node");
            }

            if (step === undefined) {
                throw new Error("Step must be an instruction node");
            }

            continueNode.insertBefore(init);
            node.insertBefore(step);

            head = init;
        } else if ($jp.kind == "dowhile") {
            head = bodyHead;
        } else if ($jp.kind == "while") {
            head = continueNode;
        } else {
            throw new Error(`Unsupported loop kind "${$jp.kind}"`);
        }

        node.insertBefore(continueNode);

        return [head, breakNode];
    }

    #processSwitch(
        $jp: Switch,
        context: ProcessJpContext,
    ): [SwitchNode.Class, ScopeEndNode.Class?] {
        const $body = $jp.getChild(1);
        if (!($body instanceof Scope)) {
            throw new Error("Switch body must be a scope");
        }
        const breakNode = this.#createTemporaryNode($body);
        const caseNodes: UnknownInstructionNode.Class[] = [];
        const innerContext = { ...context, breakNode, caseNodes };
        const [bodyHead, bodyTail] = this.#processScope($body, innerContext);
        const defaultCase = innerContext.defaultCase;

        const node = this.#graph
            .addNode()
            .init(new SwitchNode.Builder($jp))
            .as(SwitchNode.Class);

        bodyHead.insertBefore(node);

        let previousCase: ConditionNode.Class | undefined = undefined;
        for (const tempCaseNode of caseNodes) {
            const currentCase = this.#graph.addCondition(
                tempCaseNode.jp as Case,
                tempCaseNode.nextNode!,
                tempCaseNode, // False node doesn't matter for now, since it will change
            );

            if (previousCase === undefined) {
                bodyHead.nextNode = currentCase;
            } else {
                previousCase.falseNode = currentCase;
            }

            for (const incomer of tempCaseNode.incomers) {
                incomer.target = tempCaseNode.nextNode!;
            }

            previousCase = currentCase;
        }

        if (defaultCase !== undefined) {
            const currentCase = this.#graph.addCondition(
                defaultCase.jp as Case,
                defaultCase.nextNode!,
                defaultCase, // False node doesn't matter for now, since it will change
            );

            if (previousCase === undefined) {
                bodyHead.nextNode = currentCase;
            } else {
                previousCase.falseNode = currentCase;
            }

            for (const incomer of defaultCase.incomers) {
                incomer.target = defaultCase.nextNode!;
            }

            previousCase = currentCase;
        }

        let scopeEnd = bodyTail;
        if (scopeEnd === undefined) {
            if (breakNode.incomers.length === 0) {
                return [node];
            }

            scopeEnd = this.#graph
                .addNode()
                .init(new ScopeEndNode.Builder($body, ScopeEndNode.Kind.BROKEN_FLOW))
                .as(ScopeEndNode.Class);

            breakNode.nextNode = scopeEnd;
        }

        scopeEnd.insertBefore(breakNode);

        if (previousCase === undefined) {
            bodyHead.nextNode = scopeEnd;
        } else {
            previousCase.falseNode = scopeEnd;
        }

        return [node, scopeEnd];
    }

    #processLabelStmt(
        $jp: LabelStmt,
        context: ProcessJpContext,
    ): [GotoLabelNode.Class, GotoLabelNode.Class] {
        const node = this.#graph
            .addNode()
            .init(new GotoLabelNode.Builder($jp))
            .as(GotoLabelNode.Class);

        context.labels.set($jp.decl.name, node);

        const gotos = context.gotos.get($jp.decl.name);
        if (gotos !== undefined) {
            for (const goto of gotos) {
                this.#connectArbitraryJump(goto, node);
            }
        }

        return [node, node];
    }

    #processGoto($jp: GotoStmt, context: ProcessJpContext): [GotoNode.Class] {
        const node = this.#graph
            .addNode()
            .init(new GotoNode.Builder($jp))
            .as(GotoNode.Class);

        if (context.gotos.has($jp.label.name)) {
            context.gotos.get($jp.label.name)!.push(node);
        } else {
            context.gotos.set($jp.label.name, [node]);
        }

        const label = context.labels.get($jp.label.name);
        if (label !== undefined) {
            this.#connectArbitraryJump(node, label);
        }

        return [node];
    }

    #createTemporaryNode($jp?: Joinpoint): UnknownInstructionNode.Class {
        const node = this.#graph
            .addNode()
            .init(new UnknownInstructionNode.Builder($jp))
            .as(UnknownInstructionNode.Class);
        this.#temporaryNodes.push(node);
        return node;
    }

    #addInstruction(
        builder: NodeBuilder<InstructionNode.Data, InstructionNode.ScratchData>,
    ): [InstructionNode.Class, InstructionNode.Class] {
        const node = this.#graph.addNode().init(builder).as(InstructionNode.Class);
        return [node, node];
    }

    #addOutwardsJump(
        builder: NodeBuilder<InstructionNode.Data, InstructionNode.ScratchData>,
        jumpTo: FlowNode.Class,
    ): [InstructionNode.Class] {
        const node = this.#graph.addNode().init(builder).as(InstructionNode.Class);

        let exitNode: InstructionNode.Class = node;
        let $currentJp = node.jp!;

        while ($currentJp.astId !== jumpTo.jp!.astId) {
            if ($currentJp instanceof Scope) {
                const endScope = this.#graph
                    .addNode()
                    .init(new ScopeEndNode.Builder($currentJp, ScopeEndNode.Kind.BROKEN_FLOW))
                    .as(ScopeEndNode.Class);

                exitNode.nextNode = endScope;
                exitNode = endScope;
            }
            
            $currentJp = $currentJp.parent;
        }

        exitNode.nextNode = jumpTo;

        return [node];
    }

    #connectArbitraryJump(from: InstructionNode.Class, to: FlowNode.Class) {
        const fromScopes = this.#getScopeList(from.jp!);
        const toScopes = this.#getScopeList(to.jp!);
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

        let exitNode: InstructionNode.Class = from;

        for (let i = 0; i <= fromScopesIdx; i++) {
            const endScope = this.#graph
                .addNode()
                .init(new ScopeEndNode.Builder(fromScopes[i], ScopeEndNode.Kind.BROKEN_FLOW))
                .as(ScopeEndNode.Class);

            exitNode.nextNode = endScope;
            exitNode = endScope;
        }

        for (let i = toScopesIdx; i >= 0; i--) {
            const startScope = this.#graph
                .addNode()
                .init(new ScopeStartNode.Builder(toScopes[i], ScopeStartNode.Kind.BROKEN_FLOW))
                .as(ScopeStartNode.Class);

            exitNode.nextNode = startScope;
            exitNode = startScope;
        }

        exitNode.nextNode = to;
    }

    #getScopeList($jp: Joinpoint): Scope[] {
        const result: Scope[] = [];

        while (true) {
            if ($jp instanceof Scope) {
                result.push($jp);
            }
            if ($jp.hasParent) {
                $jp = $jp.parent;
            } else {
                break;
            }
        }

        return result;
    }
}

interface ProcessJpContext {
    returnNode: FlowNode.Class;
    labels: Map<string, InstructionNode.Class>;
    gotos: Map<string, InstructionNode.Class[]>;
    continueNode?: FlowNode.Class;
    breakNode?: FlowNode.Class;
    caseNodes?: UnknownInstructionNode.Class[];
    defaultCase?: UnknownInstructionNode.Class;
}
