declare module '@shexjs/parser' {
  function construct(): Parser;

  interface Parser {
    parse(shex: string): Schema;
  }

  type Schema = {
    '@context'?: 'http://www.w3.org/ns/shex.jsonld';
    type: 'Schema';
    startActs?: SemAct[];
    start?: shapeExpr;
    shapes?: ({ id: string } & shapeExprObject)[];
    imports?: string[];
  };

  type shapeExpr = shapeExprObject | string;
  type shapeExprObject = ShapeOr | ShapeAnd | ShapeNot | NodeConstraint | Shape | ShapeExternal;

  type ShapeOr = {
    id?: string;
    type: 'ShapeOr';
    shapeExprs: shapeExpr[];
  };
  type ShapeAnd = {
    id?: string;
    type: 'ShapeAnd';
    shapeExprs: shapeExpr[];
  };
  type ShapeNot = { id?: string; type: 'ShapeNot'; shapeExpr: shapeExpr };
  type ShapeExternal = { id?: string; type: 'ShapeExternal' };

  type NodeConstraint = { id?: string; type: 'NodeConstraint' } & (nonLiteralNodeConstraint | literalNodeConstraint);

  type nonLiteralNodeConstraint = ({ nodeKind?: 'iri' } & stringFacets) | { nodeKind: 'bnode' | 'nonliteral' };

  type literalNodeConstraint =
    | ({ nodeKind: 'literal' } & xsFacets)
    | datatypeConstraint
    | valueSetConstraint
    | numericFacets;

  type datatypeConstraint = { datatype: string } & xsFacets;
  type valueSetConstraint = { values: valueSetValue[] } & xsFacets;

  type stringLength = { length: number } | { minlength?: number; maxlength?: number }; // This doubles as an empty string facet

  type stringFacets = stringLength & { pattern?: string; flags?: string };

  type numericFacets = {
    mininclusive?: number;
    minexclusive?: number;
    maxinclusive?: number;
    maxexclusive?: number;
    totaldigits?: number;
    fractiondigits?: number;
  };

  type xsFacets = stringFacets & numericFacets;

  type valueSetValue =
    | objectValue
    | IriStem
    | IriStemRange
    | LiteralStem
    | LiteralStemRange
    | Language
    | LanguageStem
    | LanguageStemRange;

  type objectValue = string | ObjectLiteral;
  type ObjectLiteral = { value: string; language?: string; type?: string };

  type IriStem = { type: 'IriStem'; stem: string };
  type IriStemRange = {
    type: 'IriStemRange';
    stem: string | Wildcard;
    exclusions: (string | IriStem)[];
  };

  type LiteralStem = { type: 'LiteralStem'; stem: string };
  type LiteralStemRange = {
    type: 'LiteralStemRange';
    stem: string | Wildcard;
    exclusions: (string | LiteralStem)[];
  };

  type Language = { type: 'Language'; languageTag: string };
  type LanguageStem = { type: 'LanguageStem'; stem: string };
  type LanguageStemRange = {
    type: 'LanguageStemRange';
    stem: string | Wildcard;
    exclusions: (string | LanguageStem)[];
  };

  type Wildcard = { type: 'Wildcard' };

  type Shape = {
    id?: string;
    type: 'Shape';
    closed?: boolean;
    extra?: string[];
    expression?: tripleExpr;
    semActs?: SemAct[];
    annotations?: Annotation[];
  };

  type tripleExpr = tripleExprObject | string;
  type tripleExprObject = EachOf | OneOf | TripleConstraint;

  type EachOf = {
    id?: string;
    type: 'EachOf';
    expressions: tripleExpr[];
    min?: number;
    max?: number;
    semActs?: SemAct[];
    annotations?: Annotation[];
  };

  type OneOf = {
    id?: string;
    type: 'OneOf';
    expressions: tripleExpr[];
    min?: number;
    max?: number;
    semActs?: SemAct[];
    annotations?: Annotation[];
  };

  type TripleConstraint<P extends string = string, V extends shapeExpr | undefined = shapeExpr | undefined> = {
    id?: string;
    type: 'TripleConstraint';
    inverse?: boolean;
    predicate: string;
    valueExpr?: shapeExpr;
    min?: number;
    max?: number;
    semActs?: SemAct[];
    annotations?: Annotation[];
  };

  type SemAct = { type: 'SemAct'; name: string; code?: string };
  type Annotation<P = string, O = objectValue> = {
    type: 'Annotation';
    predicate: P;
    object: O;
  };
}

declare module '@shexjs/util' {
  import * as RDF from '@rdfjs/types';
  import { Schema } from '@shexjs/parser';
  interface DB {
    getQuads(
      subject: RDF.Term | string | null,
      predicate: RDF.Term | string | null,
      object: RDF.Term | string | null,
      graph: RDF.Term | string | null
    ): RDF.Quad[];
    getSubjects(
      predicate: RDF.Term | string | null,
      object: RDF.Term | string | null,
      graph: RDF.Term | string | null
    ): RDF.Quad_Subject[];
    getPredicates(
      subject: RDF.Term | string | null,
      object: RDF.Term | string | null,
      graph: RDF.Term | string | null
    ): RDF.Quad_Predicate[];
    getObjects(
      subject: RDF.Term | string | null,
      predicate: RDF.Term | string | null,
      graph: RDF.Term | string | null
    ): RDF.Quad_Object[];
    getGraphs(
      subject: RDF.Term | string | null,
      predicate: RDF.Term | string | null,
      object: RDF.Term | string | null
    ): RDF.Quad_Graph[];
    size: number;
  }

  export interface RdfJsDB extends DB {}

  export function rdfjsDB(store: RDF.DatasetCore): RdfJsDB;
  export function emptySchema(): { type: 'Schema' };
  export function merge(left: Schema, right: Schema, overwrite: boolean, inPlace: boolean): void;
}

declare module '@shexjs/shape-path-query';
