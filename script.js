//which section of selection
sectionNo = 0;
var noOfBytes = 4;
endianNess = $("#Endian")[0][0].selected; //1- little 0-big

function rainbow(numOfSteps, step) {
  // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
  // Adam Cole, 2011-Sept-14
  // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
  var r, g, b;
  var h = step / numOfSteps;
  var i = ~~(h * 6);
  var f = h * 6 - i;
  var q = 1 - f;
  switch (i % 6) {
    case 0:
      r = 1;
      g = f;
      b = 0;
      break;
    case 1:
      r = q;
      g = 1;
      b = 0;
      break;
    case 2:
      r = 0;
      g = 1;
      b = f;
      break;
    case 3:
      r = 0;
      g = q;
      b = 1;
      break;
    case 4:
      r = f;
      g = 0;
      b = 1;
      break;
    case 5:
      r = 1;
      g = 0;
      b = q;
      break;
  }
  var c =
    "#" +
    ("00" + (~~(r * 255)).toString(16)).slice(-2) +
    ("00" + (~~(g * 255)).toString(16)).slice(-2) +
    ("00" + (~~(b * 255)).toString(16)).slice(-2);
  return c;
}

var selections = [];

function hex2bin(hex) {
  return parseInt(hex, 16)
    .toString(2)
    .padStart(8 * noOfBytes, "0");
}

function updateScroll() {
  const element = document.getElementById("status");
  element.scrollTop = element.scrollHeight;
}

//Generate table header
for (i = 8 * noOfBytes - 1; i > -1; i--) {
  th = document.createElement("th");
  if (i < 10) th.innerHTML = "0" + i;
  else th.innerHTML = i;
  $("#bittable")
    .find("thead")
    .append(th);
}

$("#resizeme").resizable({
  //alsoResize: ".modal-dialog",
  handles: "n"
});

$("#input").val("FEDCBA9876543210");

$("#input").on("paste keydown keyup", function() {
  val = $("#input").val();

  const container = document.querySelector("tbody");
  container.innerHTML = "";
  count = 0;
  childContainer = container;
  childContainer.classList.add("animated");
  childContainer.classList.add("fadeIn");

  regex = new RegExp(".{1," + noOfBytes * 2 + "}", "g");
  bytesString = val.match(regex);
  endianByteString = bytesString;

  //If little endian, flip order of bytes in each word
  if (endianNess) {
    bytesString = bytesString.map(x =>
      x
        .match(/../g)
        .reverse()
        .join("")
    );
  }

  for (val32bit of bytesString) {
    valh = hex2bin(val32bit);
    console.log("Decoding value :" + val32bit);
    //For each bit add a 'td' element
    for (bit of valh) {
      if (count % 32 == 0) {
        childContainer = document.createElement("tr");
        childContainer.classList.add("animated");
        childContainer.classList.add("flipInX");
        container.append(childContainer);
      }
      dv = document.createElement("td");
      dv.innerHTML = '<td class="text-center">' + bit + "</td>";
      childContainer.appendChild(dv);
      count = count + 1;
    }
  }
});

$("#Endian").on("change select", function() {
  $("#input").keydown();
  endianNess = $("#Endian")[0][0].selected;
});

$("#clearAll").on("click", function() {
  $("#input").keydown();
  $("#status").empty();
  sectionNo = 0;
  frame = {};
});

//Trigger a change for default value
$("#input").keydown();

$("table td").dblclick(function(e) {
  e.stopPropagation(); //<-------stop the bubbling of the event here
  console.log("dblclick");
});

//Frame building logic
var frame = {};

// create the editor
const container = document.getElementById("jsoneditor");
const options = {};
const editor = new JSONEditor(container, options);

editor.set(frame);

// get json
const updatedJson = editor.get();

function recordFrame(frm, to) {
  fieldName = "Field" + sectionNo;
  //$("#frame").append("<div>" + fieldName + " " + frm + ":" + to + "</div>");
  editor.set(frame);

  frame[fieldName] = [frm, to];
}

// Initialize selectionjs
const selection = Selection.create({
  // Class for the selection-area
  class: "selection",

  // All elements in this container can be selected
  selectables: ["td"],

  // The container is also the boundary in this case
  boundaries: ["tbody"],

  // Query selector or dom node to set up container for selection-area-element
  selectionAreaContainer: "table",

  // px, how many pixels the point should move before starting the selection (combined distance).
  // Or specifiy the threshold for each axis by passing an object like {x: <number>, y: <number>}.
  startThreshold: 5,

  //disable single click selection
  singleClick: false
})
  .on("start", ({ inst, selected, oe }) => {
    sectionNo = sectionNo + 1;
    console.log("start " + sectionNo);
    // Remove class if the user isn't pressing the control key or ⌘ key
    if (!oe.ctrlKey && !oe.metaKey) {
      // Unselect all elements
      for (const el of selected) {
        //el.classList.remove('selected');
        //inst.removeFromSelection(el);
      }
      const container = document.querySelector(".status.text");
      //const container = $("#status");

      dv = document.createElement("div");
      dv.innerHTML = "XX";
      inst.dv = dv;
      container.appendChild(dv);
      // Clear previous selection
      //inst.clearSelection();
    }
  })
  .on("move", ({ changed: { removed, added } }) => {
    // Add a custom class to the elements that where selected.
    console.log("Move " + sectionNo);
    for (const el of added) {
      el.classList.add("bg-success");
      el.classList.add("animated");
      el.classList.add("fadeIn");
    }

    // Remove the class from elements that where removed
    // since the last selection
    for (const el of removed) {
      el.classList.remove("bg-success");
    }
  })
  .on("stop", ({ inst }) => {
    val = 0;
    count = 0;
    color = rainbow(100, sectionNo * 10);
    inst.keepSelection();
    console.log("Stop " + sectionNo);
    vals = "";
    selectedElements = inst.getSelection();
    for (const el of selectedElements) {
      vals = vals + el.textContent;
      count = count + 1;
      el.classList.remove("bg-success");
      el.classList.remove("fadeIn");

      el.style.backgroundColor = color;
    }
    selections.push(selectedElements);

    console.log(vals);
    val = parseInt(vals, 2);
    inst.dv.classList.add("animated");
    inst.dv.classList.add("bounceIn");
    selectedRow = selectedElements[0].parentElement.rowIndex;
    lowIndex = 31 - selectedElements[0].cellIndex + selectedRow * 32;
    highIndex =
      31 -
      selectedElements[selectedElements.length - 1].cellIndex +
      selectedRow * 32;
    inst.dv.innerHTML = lowIndex + ":" + highIndex + "=" + val.toString(16);
    inst.dv.style.backgroundColor = color;
    recordFrame(lowIndex, highIndex);
    selection.clearSelection();
    updateScroll();
  });
$("#clear").click(function() {
  selection.clearSelection();
});
