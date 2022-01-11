const convert = (from, to) => str => Buffer.from(str, from).toString(to)
const utf8ToHex = convert('utf8', 'hex')
const hexToUtf8 = convert('hex', 'utf8')

function initalt(initval){
  sudoku.initsudoku(initval);
  console.log("started init");
  var pos = [];
  initval = initval.replace(/(\r\n|\n|\r)/gm,"");
  for(k = 0; k < 9; k++){
    pos.push([]);
    for(j = 0; j < 9; j++){
      if(Number(initval[k*9+j]) < 1){
        pos[k].push({value:Number(initval.slice(k*9+j,k*9+j+1)), hypothetical:[1,2,3,4,5,6,7,8,9], solvedat: undefined, solvednow: false, solvedby: undefined});
      }else{
        pos[k].push({value:Number(initval.slice(k*9+j,k*9+j+1)), hypothetical:[1,2,3,4,5,6,7,8,9], solvedat: 0, solvednow: false, solvedby: undefined});
      }
    }
  }
  console.log("finished init");
  return pos;
}


//could be used instead of current pos structure
const sudoku = {
  subCycles: 0,
  pos: [],
  initsudoku: function(initval){
    for(x=0; x<9; x++){
      this.pos[x]=[]
      for(y=0; y<9; y++){
        this.pos[x][y]={
          value: Number(initval.charAt(x*9+y)),
          hypothetical: [...Array(9).keys()],
          solvedAt: Number(this.value) == 0 ? 0 : undefined
        }
      }
    }
    console.log(this.pos)
  }
}


function solveHypotheticals(pos){
  pos = rowhiddensingle(pos);
  pos = colhiddensingle(pos);
  pos = grouphiddensingle(pos);
  pos = rowlockedpointing(pos);
  pos = collockedpointing(pos);
  //pos = rowlockedclaiming(pos); //WIP

  //NEXT UP: LOCKED CANDIDATES CLAIMING(ROW AND COL)), HIDDEN SUBSETS, NAKED SUBSETS, FISH, WINGS

  return pos;
}

function rowhiddensingle(pos){
  //row hidden single
  pos = clearHypotheticals(pos);
  var rowarray = [];
  for(x = 0; x < 9; x++){
    rowarray.push([]);
    for(y = 0; y < 9; y++){
      rowarray[x] = rowarray[x].concat(pos[x][y].hypothetical);
    }
  }
  for(t = 0; t < 9; t++){
    for(n = 1; n < 10; n++){
      frowindex = rowarray[t].indexOf(n);
      if(frowindex != -1){//found first
        rowindex = rowarray[t].indexOf(n, frowindex+1);
        if(rowindex == -1){//didnt find second
          for(z = 0; z < 9; z++){
            if(pos[t][z].hypothetical.indexOf(n) != -1){
              pos[t][z].hypothetical = [n];
              //console.log("Found hidden row single: "+n+" at "+t+","+z);
              break;
            }
          }
        }
      }
    }  
  }
  pos = plotHypotheticals(pos);
  return pos;
}

function colhiddensingle(pos){
  //column hidden single
  pos = clearHypotheticals(pos);
  var colarray = [];
  for(x = 0; x < 9; x++){
    colarray.push([]);
    for(y = 0; y < 9; y++){
      colarray[x] = colarray[x].concat(pos[y][x].hypothetical);
    }
  }
  for(t = 0; t < 9; t++){
    for(n = 1; n < 10; n++){
      fcolindex = colarray[t].indexOf(n);
      if(fcolindex != -1){//found first
        colindex = colarray[t].indexOf(n, fcolindex+1);
        if(colindex == -1){//didnt find second
          for(z = 0; z < 9; z++){
            if(pos[z][t].hypothetical.indexOf(n) != -1){
              pos[z][t].hypothetical = [n];
              //console.log("Found hidden column single: "+n+" at "+z+","+t);
              break;
            }
          }
        }
      }
    }  
  }
  pos = plotHypotheticals(pos);
  return pos;
}

function grouphiddensingle(pos){
  //group hidden single
  pos = clearHypotheticals(pos);
  let grouphypos = [];
  for(n = 0; n < 3; n++){
    grouphypos.push([]);
    for(m = 0; m < 3; m++){
      grouphypos[n].push([]);
      for(z = 0; z < 3; z++){
        for(x = 0; x < 3; x++){
          grouphypos[n][m] = grouphypos[n][m].concat(pos[z+n*3][x+m*3].hypothetical);
        }
      }
    }
  }
  for(grr = 0; grr < 3; grr++){
    for(grc = 0; grc < 3; grc++){
      for(number = 1; number < 10; number++){
        fgroupindex = grouphypos[grr][grc].indexOf(number);
        if(fgroupindex != -1){//found first
          groupindex = grouphypos[grr][grc].indexOf(number, fgroupindex+1);
          if(groupindex == -1){//didnt find second
            for(d = 0; d < 3; d++){
              for(e = 0; e < 3; e++){
                index = pos[d+grr*3][e+grc*3].hypothetical.indexOf(number);
                if(index > -1){
                  pos[d+grr*3][e+grc*3].hypothetical = [number];
                  //console.log("Found hidden group single: "+number+" at "+(d+grr*3)+","+(e+grc*3));
                  break;
                }
              }
            }
          }
        }
      }  
    }
  }
  pos = plotHypotheticals(pos);
  return pos;
}

function rowlockedpointing(pos){
  //row locked candidate (pointing)
  pos = clearHypotheticals(pos);
  let khypos = []
  let grouphypos = [];
  for(n = 0; n < 3; n++){
    grouphypos.push([]);
    for(m = 0; m < 3; m++){
      grouphypos[n].push([]);
      for(z = 0; z < 3; z++){
        grouphypos[n][m].push([]);
        for(x = 0; x < 3; x++){
          grouphypos[n][m][z] = grouphypos[n][m][z].concat(pos[z+n*3][x+m*3].hypothetical);
        }
      }
    }
  }
  for(v = 0; v < 3; v++){
    for(b = 0; b < 3; b++){
      for(c = 0; c < 3; c++){
        for(number = 1; number < 10; number++){
          if(grouphypos[v][b][c].indexOf(number) > -1){
            khypos = []
              for(k = 0; k < 3; k++){
                if(c != k){
                  khypos = khypos.concat(grouphypos[v][b][k]);
                }
              }
              if(khypos.indexOf(number) == -1){
                for(g = 0; g < 3; g++){
                  if(g != b){
                    if(grouphypos[v][g][c].indexOf(number) > -1){//location of hypo to remove
                      for(h = 0; h < 3; h++){
                        if(h != c){
                          if(grouphypos[v][g][h].indexOf(number) > -1){
                            //'v' and 'b' describe group. 'g' also describes group.
                            //'c' describes row in group. 'h' also describes row in group.
                            for(f = 0; f < 3; f++){
                              if(pos[v*3+c][g*3+f].hypothetical.indexOf(number) > -1){
                                pos[v*3+c][g*3+f].hypothetical.splice(pos[v*3+c][g*3+f].hypothetical.indexOf(number), 1);
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
          }
        }
      }
    }
  }
  pos = plotHypotheticals(pos);
  return pos;
}

function collockedpointing(pos){
  //col locked candidate (pointing)
  pos = clearHypotheticals(pos);
  let khypos = []
  let grouphypos = [];
  for(n = 0; n < 3; n++){
    grouphypos.push([]);
    for(m = 0; m < 3; m++){
      grouphypos[n].push([]);
      for(z = 0; z < 3; z++){
        grouphypos[n][m].push([]);
        for(x = 0; x < 3; x++){
          grouphypos[n][m][z] = grouphypos[n][m][z].concat(pos[x+m*3][z+n*3].hypothetical);
        }
      }
    }
  }
  
  for(v = 0; v < 3; v++){
    for(b = 0; b < 3; b++){
      for(c = 0; c < 3; c++){
        for(number = 1; number < 10; number++){
          if(grouphypos[v][b][c].indexOf(number) > -1){
            khypos = []
              for(k = 0; k < 3; k++){
                if(c != k){
                  khypos = khypos.concat(grouphypos[v][b][k]);
                }
              }
              if(khypos.indexOf(number) == -1){
                for(g = 0; g < 3; g++){
                  if(g != b){
                    if(grouphypos[v][g][c].indexOf(number) > -1){//location of hypo to remove
                      for(h = 0; h < 3; h++){
                        if(h != c){
                          if(grouphypos[v][g][h].indexOf(number) > -1){
                            //'v' and 'b' describe group. 'g' also describes group.
                            //'c' describes row in group. 'h' also describes row in group.
                            for(f = 0; f < 3; f++){
                              if(pos[v*3+c][g*3+f].hypothetical.indexOf(number) > -1){
                                pos[v*3+c][g*3+f].hypothetical.splice(pos[v*3+c][g*3+f].hypothetical.indexOf(number), 1);
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
          }
        }
      }
    }
  }
  
  pos = plotHypotheticals(pos);
  return pos;
}

function rowlockedclaiming(pos){
  //row locked candidate (claiming)
  pos = clearHypotheticals(pos);
  let khypos = []
  let lhypos = []
  let grouphypos = [];
  for(n = 0; n < 3; n++){
    grouphypos.push([]);
    for(m = 0; m < 3; m++){
      grouphypos[n].push([]);
      for(z = 0; z < 3; z++){
        grouphypos[n][m].push([]);
        for(x = 0; x < 3; x++){
          grouphypos[n][m][z] = grouphypos[n][m][z].concat(pos[z+n*3][x+m*3].hypothetical);
        }
      }
    }
  }

  for(v = 0; v < 3; v++){
    for(b = 0; b < 3; b++){
      for(c = 0; c < 3; c++){
        for(number = 1; number < 10; number++){
          if(grouphypos[v][b][c].indexOf(number) > -1){//line has hyponumber
            if(grouphypos[v][b][c].indexOf(number, grouphypos[v][b][c].indexOf(number)+1) > -1){
              khypos = [];
              for(k = 0; k < 3; k++){
                if(c != k){//other than current line(but same group)
                  khypos = khypos.concat(grouphypos[v][b][k]);
                }
              }
              if(khypos.indexOf(number) > -1){//if same group has hyponumber on other lines
                for(g = 0; g < 3; g++){
                  if(g != b){//other than current group(but same line)
                    if(grouphypos[v][g][c].indexOf(number) == -1){//if other lines don't have hyponumber
                      //khypos = [];
                      lhypos = []
                      for(l = 0; l < 3; l++){
                        if(l != c){
                          lhypos = lhypos.concat(grouphypos[v][g][l]);
                        }
                      }
                      if(khypos.indexOf(number) > -1){//if other group has hyponumber on other lines

                        /*
                        for(p = 0; p < 3; p++){
                          if(p != c){
                            if(grouphypos[v][g][p].indexOf(number) > -1){

                          }
                        }
                      }
                      */
                      for(h = 0; h < 3; h++){
                        if(h != c){
                          if(grouphypos[v][b][h].indexOf(number) > -1){//same group different line
                            //'v' and 'b' describe group. 'g' also describes group.
                            //'c' describes row in group. 'h' also describes row in group.
                            for(f = 0; f < 3; f++){
                              if(pos[v*3+h][b*3+f].hypothetical.indexOf(number) > -1){
                                pos[v*3+h][b*3+f].hypothetical.splice(pos[v*3+c][b*3+f].hypothetical.indexOf(number), 1);
                                console.log(grouphypos);
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            }
          }
        }
      }
    }
  }
  pos = plotHypotheticals(pos);
  return pos;
}

function collockedclaiming(pos){

}

function clearHypotheticals(pos){
  var index;
  for(i = 0; i < 9; i++){
    for(j = 0; j < 9; j++){
      if(pos[i][j].value != "0"){//position has a value
        pos[i][j].hypothetical = [];//clear own hypotheticals
        for(o = 0; o < 9; o++){//clear row hypotheticals
          index = pos[i][o].hypothetical.indexOf(pos[i][j].value);
          if(index > -1){
            pos[i][o].hypothetical.splice(index, 1);
          }
        }
        for(k = 0; k < 9; k++){//clear column hypotheticals
          index = pos[k][j].hypothetical.indexOf(pos[i][j].value);
          if(index > -1){
            pos[k][j].hypothetical.splice(index, 1);
          }
        }
        for(n = 0; n < 3; n++){//clear group hypotheticals
          for(m = 0; m < 3; m++){
            index = pos[n+(Math.floor(i/3)*3)][m+(Math.floor(j/3)*3)].hypothetical.indexOf(pos[i][j].value);
            if(index > -1){
              pos[n+(Math.floor(i/3)*3)][m+(Math.floor(j/3)*3)].hypothetical.splice(index, 1);
            }
          }
        }
      }
    }
  }
  return pos;
}

function plotHypotheticals(pos){
  //Solves Naked Candidates
  for(i=0;i<9;i++){
    for(j=0;j<9;j++){
      if(pos[i][j].hypothetical.length == 1){
        pos[i][j].value = pos[i][j].hypothetical[0];
        pos[i][j].hypothetical = [];
        pos[i][j].solvednow = true;
      }
    }
  }
  return pos;
}

function solve(){
  var pos = initalt(extractValues());
  console.log("Started solving!")
  
  var iterations = 0;
  //var rowsolved = [];
  var solved = false;
  var lastiterhypo = [];
  var iterhypo = [];
  var lastiterhypostring = "";
  var iterhypostring = "";
  const reducer = (accumulator, currentValue) => accumulator + currentValue;
  do{
    pos = solveHypotheticals(pos);
    
    for(o=0;o<9;o++){
      for(k=0;k<9;k++){
        if(pos[o][k].solvednow == true){
          pos[o][k].solvedat = iterations + 1;
          pos[o][k].solvednow = false;
        }
      }
    }
  
    iterations++;
    
    for(b = 0; b < 9; b++){
      for(c = 0; c <9; c++){
        if(pos[b][c].hypothetical.length > 0){
          iterhypo.push(pos[b][c].hypothetical.reduce(reducer));
        }else{
          iterhypo.push(0);
        }
      }
    }
    iterhypostring = iterhypo.toString();
    if(lastiterhypostring.length > 0){
      if(lastiterhypostring == iterhypostring){
        //console.log("Got stuck at "+iterations+" iterations.");
        solved = true;
      }else{
        iterhypo = []
        lastiterhypo = []
      }
    }
    for(b = 0; b < 9; b++){
      for(c = 0; c <9; c++){
        if(pos[b][c].hypothetical.length > 0){
          lastiterhypo.push(pos[b][c].hypothetical.reduce(reducer));
        }else{
          lastiterhypo.push(0);
        }
      }
    }
    lastiterhypostring = lastiterhypo.toString();

  }while(!solved)
    console.log("Solving took "+iterations+" iterations!")
    insertValues(pos);
    classnum(iterations);
    currclass.hideundefined();
  }

function createInputs(){
  var sudoku = document.getElementsByTagName("template")[0].content.cloneNode(true);
  var main = document.getElementById("main");
  var str;
  for(i=0;i<9;i++){
    for(o=0;o<9;o++){
      input = document.getElementsByTagName("template")[1].content.cloneNode(true);
      str = String(i)+String(o);
      sudoku.getElementById(str).appendChild(input);
    }
  }
  main.appendChild(sudoku);
}

function extractValues(){
  var arr = [];
  var str;
  for(i=0;i<9;i++){
    for(o=0;o<9;o++){
      str = String(i)+String(o);
      x = document.getElementById(str).childNodes[2].value
      if(x == ""){
        arr.push(" ");
      }else{
        arr.push(x);
      }
    }
  }
  return arr.join("");
}

function insertValues(arr){
  var sudoku = document.getElementsByTagName("template")[0].content.cloneNode(true);
  var main = document.getElementById("main");
  var str;
  for(i=0;i<9;i++){
    for(o=0;o<9;o++){
      var value = document.getElementsByTagName("template")[2].content.cloneNode(true);
      str = String(i)+String(o);
      value.getElementById("val").innerText = String(arr[i][o].value);
      value.getElementById("val").classList.add("_"+arr[i][o].solvedat);
      //console.log(value.getElementById("val"));
      sudoku.getElementById(str).appendChild(value);
    }
  }
  main.innerHTML = "";
  main.appendChild(sudoku);
}

function classnum(num){
  window.options = {new: {color: "green", visibility: "visible", backgroundColor: "palegreen"},
                  old: {color: "black", visibility: "visible", backgroundColor: "white"},
                  hidden: {color: "green", visibility: "hidden", backgroundColor: "white"},
                  error: {color: "lightcoral", visibility: "visible", backgroundColor: "lightcoral"}
                 }
  window.currclass = {classnum: num,
                      originalnum: num,
                      forwards : function(){if(this.classnum<this.originalnum){this.classnum = this.classnum + 1;} return this.classnum;},
                      backwards : function(){if(this.classnum>0){this.classnum = this.classnum - 1;} return this.classnum;},
                      classname: function(classvar){return "_" + String(classvar)},
                      prevnum: function(){return this.classnum - 1;},
                      nextnum: function(){return this.classnum + 1;},
                      style: {new: function(classelement){
                                var elements = document.getElementsByClassName(classelement);
                                var i = elements.length;
                                while(i--){
                                  elements[i].style.color = options.new.color;
                                  elements[i].style.visibility = options.new.visibility;
                                  elements[i].style.backgroundColor = options.new.backgroundColor;
                                }
                                },
                              old: function(classelement){
                                var elements = document.getElementsByClassName(classelement);
                                var i = elements.length;
                                while(i--){
                                  elements[i].style.color = options.old.color;
                                  elements[i].style.visibility = options.old.visibility;
                                  elements[i].style.backgroundColor = options.old.backgroundColor;
                                }
                                },
                              hidden: function(classelement){
                                var elements = document.getElementsByClassName(classelement);
                                var i = elements.length;
                                while(i--){
                                  elements[i].style.color = options.hidden.color;
                                  elements[i].style.visibility = options.hidden.visibility;
                                  elements[i].style.backgroundColor = options.hidden.backgroundColor;
                                }
                               },
                               error: function(classelement){
                                var elements = document.getElementsByClassName(classelement);
                                var i = elements.length;
                                while(i--){
                                  elements[i].style.color = options.error.color;
                                  elements[i].style.visibility = options.error.visibility;
                                  elements[i].style.backgroundColor = options.error.backgroundColor;
                                }
                               }
                              },
                      nextframe: function(){
                        if(this.classnum == this.originalnum){
                          this.classnum = 0;
                          this.hideall();
                        }else{
                          this.forwards();
                        }
                        this.style.new(this.classname(this.classnum));
                        this.style.old(this.classname(this.prevnum()));
                      },
                      prevframe: function(){
                        if(this.classnum == 0){
                          this.classnum = this.originalnum;
                          this.showall();
                        }else{
                          this.backwards();
                        }
                        this.style.new(this.classname(this.classnum));
                        this.style.hidden(this.classname(this.nextnum()));
                      },
                      hideundefined: function(){
                        this.style.error("_undefined");
                      },
                      hideall: function(){
                        for(i = 1; i <= this.originalnum; i++){
                          this.style.hidden(this.classname(i));
                        }
                      },
                      showall: function(){
                        for(i = 0; i <= this.originalnum; i++){
                          this.style.old(this.classname(i));
                        }
                        this.style.new(this.classname(this.originalnum));
                      }
                      }
}

function changefirst(){
  var firstsquare = document.getElementById("00");
  var testhypos = document.getElementsByTagName("template")[3].content.cloneNode(true);
  firstsquare.innerHTML = "";
  firstsquare.append(testhypos);

}
