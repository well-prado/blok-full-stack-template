import ErrorNode from "./ErrorNode";
import MapperNode from "./MapperNode";
import MongoQuery from "./mongodb-query";

const ExampleNodes = {
	"mongo-query": new MongoQuery(),
	"mapper": new MapperNode(),
	"error": new ErrorNode(),
};

export default ExampleNodes;
