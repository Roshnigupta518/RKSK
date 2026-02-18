export const RegexType = {
    remark: {
      regex:/^[a-zA-Z0-9\u0900-\u097F ]+$/,
      emptyError: 'Please enter remark',
      typeError: 'Only Hindi, English letters and numbers allowed',
    },

    meetings: {
        regex:/^[a-zA-Z0-9\u0900-\u097F ]+$/,
        emptyError: 'This field is required',
        typeError: 'Only Hindi, English letters and numbers allowed',
      },

      activityDetails: {
        regex:/^[a-zA-Z0-9\u0900-\u097F ]+$/,
        emptyError: 'This field is required',
        typeError: 'Only Hindi, English letters and numbers allowed',
      },
}