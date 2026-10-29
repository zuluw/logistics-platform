export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static send(res, statusCode, data, message) {
    const response = new ApiResponse(statusCode, data, message);
    return res.status(statusCode).json(response);
  }

  static ok(res, data, message = 'Operation completed successfully') {
    return ApiResponse.send(res, 200, data, message);
  }

  static created(res, data, message = 'Resource created successfully') {
    return ApiResponse.send(res, 201, data, message);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}