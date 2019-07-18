import {InterfaceGenerator} from "./InterfaceGenerator";

const simpleSchema = {
    type: "object",
    properties: {
        param: {
            type: "number",
        },
    },
};

const schemaWithOptionalAndRequiredParams = {
    type: "object",
    properties: {
        optionalParam: {
            type: "number",
        },
        requiredParam: {
            type: "number",
            required: true,
        },
    },
};

const schemaWithCustomType = {
    type: "object",
    properties: {
        param: {
            type: "User",
        },
    },
};

const schemaWithEnum = {
    type: "object",
    properties: {
        param: {
            type: "string",
            enum: ["a", "b", "c"],
        },
    },
};

const schemaWithTwoCustomTypes = {
    type: "object",
    properties: {
        param: {
            type: "User",
        },
        param2: {
            $ref: "#/definitions/Admin",
        },
    },
    definitions: {
        Admin: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                },
            },
        },
    },
};

describe("Interface generator", () => {
    let generator: InterfaceGenerator;
    let generatorWithCustomTypes: InterfaceGenerator;

    beforeEach(() => {
        generator = new InterfaceGenerator();
        generatorWithCustomTypes = new InterfaceGenerator(["User"]);
    });

    it("should return empty string if called with empty schema", async () => {
        expect(await generator.createInterface({})).toBe("");
    });

    it("should create simple interface with one number property", async () => {
        const result = await generator.createInterface(simpleSchema);
        expect(result.includes("param?: number;")).toBeTruthy();
    });

    it("should create interface with given name", async () => {
        const name = "User";
        expect((await generator.createInterface(simpleSchema, name))
            .includes(`interface ${name}`)).toBeTruthy();
    });

    it("should generate properties with corresponding optional state", async () => {
        const interfaceString = await generator.createInterface(schemaWithOptionalAndRequiredParams);
        expect((interfaceString).includes("optionalParam?:")).toBeTruthy();
        expect((interfaceString).includes("requiredParam:")).toBeTruthy();
    });

    it("should generate enums", async () => {
        const interfaceString = await generator.createInterface(schemaWithEnum);
        expect((interfaceString).includes("export enum Param")).toBeTruthy();
        expect((interfaceString).includes("param?: Param;")).toBeTruthy();
    });

    it("should generate properties with custom types", async () => {
        const interfaceString = await generatorWithCustomTypes.createInterface(schemaWithCustomType);
        expect((interfaceString).includes("param?: User")).toBeTruthy();
    });

    it("should remove fake definitions from generated code", async () => {
        const interfaceString = await generatorWithCustomTypes.createInterface(schemaWithCustomType);
        expect((interfaceString).includes("interface User")).toBeFalsy();
    });

    it("should throw if interface name matches one of custom types", async () => {
        await expect(generatorWithCustomTypes.createInterface(schemaWithCustomType, "User"))
            .rejects.toThrow();
    });

    it("should respect existing definitions is schema", async () => {
        const result = await generatorWithCustomTypes.createInterface(schemaWithTwoCustomTypes);
        expect(result.includes("param?: User")).toBeTruthy();
        expect(result.includes("param2?: Admin")).toBeTruthy();
    });
});
