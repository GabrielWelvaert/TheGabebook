// window.onload = function() {
//     const divs = document.querySelectorAll('div');
//     divs.forEach(div => {
//         div.style.border = '1px solid red';
//     });
// };

const monthSelector = document.getElementById("monthDropdown");
const daySelector = document.getElementById("dayDropdown");
const yearSelector = document.getElementById("yearDropdown");

function addOptionToSelector(selector, value, textContent){
    const newOption = document.createElement('option');
    newOption.value = value;
    newOption.textContent = textContent;
    selector.appendChild(newOption);
}

// populates selectors with default values
function initializeSelectors(){
    for(let i = 1; i <= 12; i++){
        addOptionToSelector(monthSelector,i,i);
    }
    for(let i = 1; i <= 31; i++){
        addOptionToSelector(daySelector,i,i);
    }
    for(let i = 1900; i <= 2024; i++){
        addOptionToSelector(yearSelector,i,i);
    }

}

function validateDaySelector(monthNum, year = undefined){
    // if year is not passed, assumes non-leap year
    let numDays = monthToDays(monthNum, year);
    
    // update which days are available for this month/year
    for(let i = 1; i < daySelector.options.length; i++){
        let optionValue = daySelector.options[i].value;
        if(Number(optionValue) > numDays){ // this day should not be possible
            if(!daySelector.options[i].disabled){
                daySelector.options[i].disabled = true;
            }
        } else {
            if(daySelector.options[i].disabled){
                daySelector.options[i].disabled = false;
            }       
        }
    }

    // if a day has already been selected but it is invalid, update to highest possible day
    if(daySelector.value && Number(daySelector.value) > numDays){
        daySelector.value = String(numDays);
    }
}

// when year or month are selected, we must validate the possible days
function createSelectorEventListeners(){
    monthSelector.addEventListener('change', () => {
        validateDaySelector(monthSelector.value, yearSelector.value);
    });
    yearSelector.addEventListener('change', () => {
        validateDaySelector(monthSelector.value, yearSelector.value);
    });
}

// given monthNum and year, returns number of days 
// if year is not passed, function will assume it is not a leap year
// if month is not passed, function will return 31 days
function monthToDays(monthNum, year = undefined){ 
    
    // paramters are expected as numeric strings from selector input
    if(!monthNum){
        return 31;
    } else {
        monthNum = Number(monthNum);    
    }
    if(year){
        year = Number(year);
    }

    switch(monthNum){
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:{
            return 31;
        }
        case 4:
        case 6:
        case 9:
        case 11:{
            return 30;
        }
        case 2:{
            if(year && ((year % 4 === 0) && (year % 100 !== 0 || year % 400 === 0))){ // leap year
                return 29;  
            } else {
                return 28; 
            }
        }
        default:{
            throw new Error(`monthToDays() Invalid monthNum: ${monthNum}!`);
        }
    }

    throw new Error(`monthToDays(${monthNum}, ${year}) parameter error!`);
    return -1;
}

initializeSelectors();
createSelectorEventListeners();