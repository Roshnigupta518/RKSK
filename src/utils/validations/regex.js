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
      name: {
        regex: /^[a-zA-Z\u0900-\u097F ]+$/,
        emptyError: 'Please enter name',
        typeError: 'Only Hindi & English letters allowed',
      },
    
      father: {
        regex: /^[a-zA-Z\u0900-\u097F ]+$/,
        emptyError: 'Please enter father/guardian name',
        typeError: 'Only Hindi & English letters allowed',
      },
    
      mobile: {
        regex: /^[0-9]{10}$/,
        emptyError: 'Please enter mobile number',
        typeError: 'Mobile number must be 10 digits',
      },
    
      age: {
        regex: /^(1[0-9]|[2-9][0-9])$/, // 10–99
        emptyError: 'Please enter age',
        typeError: 'Age must be between 10 to 99',
      },
    
      sch_status: {
        regex: /^[a-zA-Z\u0900-\u097F ]+$/,
        emptyError: 'Please enter school status name',
        typeError: 'Only Hindi & English letters allowed',
      },
    
      sch_options: {
        regex: /^[a-zA-Z\u0900-\u097F ]+$/,
        emptyError: 'Please enter school status option name',
        typeError: 'Only Hindi & English letters allowed',
      },
}