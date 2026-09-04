// go_ast_inspect — Parses Go AST to extract struct signatures, interface
// implementations, and method receivers without loading full dependencies.
package tools

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
)

// ASTInspectResult holds the extracted AST information.
type ASTInspectResult struct {
	PackageName string            `json:"packageName"`
	Structs     []StructInfo      `json:"structs"`
	Interfaces  []InterfaceInfo   `json:"interfaces"`
	Functions   []FunctionInfo    `json:"functions"`
}

type StructInfo struct {
	Name   string   `json:"name"`
	Fields []string `json:"fields"`
}

type InterfaceInfo struct {
	Name    string   `json:"name"`
	Methods []string `json:"methods"`
}

type FunctionInfo struct {
	Name     string `json:"name"`
	Receiver string `json:"receiver,omitempty"`
	IsExported bool `json:"isExported"`
}

// ASTInspect implements the go_ast_inspect tool.
// params: { "filePath": string }
func ASTInspect(params map[string]interface{}) (interface{}, error) {
	filePath, ok := params["filePath"].(string)
	if !ok || filePath == "" {
		return nil, fmt.Errorf("required param: filePath (string)")
	}

	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, filePath, nil, parser.ParseComments)
	if err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}

	result := &ASTInspectResult{
		PackageName: node.Name.Name,
	}

	for _, decl := range node.Decls {
		switch d := decl.(type) {
		case *ast.GenDecl:
			for _, spec := range d.Specs {
				ts, ok := spec.(*ast.TypeSpec)
				if !ok {
					continue
				}
				switch t := ts.Type.(type) {
				case *ast.StructType:
					si := StructInfo{Name: ts.Name.Name}
					if t.Fields != nil {
						for _, f := range t.Fields.List {
							for _, name := range f.Names {
								si.Fields = append(si.Fields, name.Name)
							}
						}
					}
					result.Structs = append(result.Structs, si)
				case *ast.InterfaceType:
					ii := InterfaceInfo{Name: ts.Name.Name}
					if t.Methods != nil {
						for _, m := range t.Methods.List {
							for _, name := range m.Names {
								ii.Methods = append(ii.Methods, name.Name)
							}
						}
					}
					result.Interfaces = append(result.Interfaces, ii)
				}
			}
		case *ast.FuncDecl:
			fi := FunctionInfo{
				Name:       d.Name.Name,
				IsExported: ast.IsExported(d.Name.Name),
			}
			if d.Recv != nil && len(d.Recv.List) > 0 {
				fi.Receiver = fmt.Sprintf("%v", d.Recv.List[0].Type)
			}
			result.Functions = append(result.Functions, fi)
		}
	}

	return result, nil
}
