import json
import jsonschema

def test_case_schema_is_valid():
    with open("schema/case.schema.json", "r", encoding="utf-8") as f:
        schema = json.load(f)
    jsonschema.Draft7Validator.check_schema(schema)
    assert schema["title"] == "Fun Detective Case"
