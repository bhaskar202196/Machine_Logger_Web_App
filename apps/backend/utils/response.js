function jsonResponse(success, dataOrMessage) {
  return success
    ? { success: true, data: dataOrMessage }
    : { success: false, message: dataOrMessage };
}

export default jsonResponse;
