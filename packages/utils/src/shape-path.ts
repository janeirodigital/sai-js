import { Parser, Ast } from 'shape-path-core';
import * as ShexCParser from '@shexjs/parser';
import * as ShExUtil from '@shexjs/util';
import { shapePathQuery } from '@shexjs/shape-path-query';
import { DatasetCore } from '@rdfjs/types';

export function findChildReferences(
  parentIri: string,
  parentDataset: DatasetCore,
  parentShapeIri: string,
  parentShapeText: string,
  shapePath: string
): string[] {
  const shexParser = ShexCParser.construct();
  const schema = shexParser.parse(parentShapeText);
  const pathExpr = new Parser.ShapePathParser().parse(shapePath);
  const schemaNodes = pathExpr.evalPathExpr([schema], new Ast.EvalContext(schema));
  const db = ShExUtil.rdfjsDB(parentDataset);
  return shapePathQuery(schema, schemaNodes, db, [{ node: parentIri, shape: parentShapeIri }]);
}

// TODO (elf-pavlik) generalize
export function getPredicate(shapePath: string, shapeText: string): string {
  const shexParser = ShexCParser.construct();
  const pathExpr = new Parser.ShapePathParser().parse(shapePath);
  const schema = shexParser.parse(shapeText);
  const schemaNodes = pathExpr.evalPathExpr([schema], new Ast.EvalContext(schema));
  return schemaNodes[0].predicate;
}
