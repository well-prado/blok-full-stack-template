import {
	type INanoServiceResponse,
	type JsonLikeObject,
	NanoService,
	NanoServiceResponse,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";

type InputType = {
	model: object;
};

export default class MapperNode extends NanoService<InputType> {
	constructor() {
		super();
		this.inputSchema = {
			$schema: "http://json-schema.org/draft-04/schema#",
			type: "object",
			properties: {
				model: { type: "object" },
			},
			required: ["model"],
		};

		this.outputSchema = {
			$schema: "http://json-schema.org/draft-07/schema#",
			type: "object",
			description: "Returns the input model object as-is for mapping operations"
		};
	}

	async handle(ctx: Context, inputs: InputType): Promise<INanoServiceResponse> {
		const response: NanoServiceResponse = new NanoServiceResponse();

		try {
			response.setSuccess(inputs.model as JsonLikeObject);
		} catch (error: unknown) {
			const nodeError = new GlobalError((error as Error).message);
			nodeError.setCode(500);
			response.setError(nodeError);
		}

		return response;
	}
}
