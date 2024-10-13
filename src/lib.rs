mod utils;
use rand::Rng;
use std::fmt;
use wasm_bindgen::prelude::*;

////////////////////////////// Alert for debugging purpose
// #[wasm_bindgen]
// extern {
//     fn alert(s: &str);
// }
// #[wasm_bindgen]
// pub fn debug(x:&str){
//     alert(&format!("Debug message: {x}"));
// }
/////////////////////////////

#[wasm_bindgen] // exposes code to JavaScript
#[repr(u8)]  // to represent each Cell as a byte
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

impl Cell {
    fn toggle(&mut self) {
        *self = match *self {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead,
        };
    }
}

#[wasm_bindgen]
pub struct Universe {
    width: i32, 
    height: i32, 
    cells: Vec<Cell>,
}
impl Universe {
    fn get_index(&self, row: i32, column: i32) -> usize {  // get index in the array of a cell at [row][column]
        (row * self.width + column) as usize
    }
    fn live_neighbor_count(&self, row: i32, col: i32) -> u8 {
        let mut count_alive = 0;
        let delta:Vec<i32> = vec![-1, 0, 1];
        for row_change in delta.iter() {
            for col_change in delta.iter() {
                if *row_change == 0 && *col_change == 0 {
                    continue;
                }
                let new_row = (row + row_change + self.height)%self.height;
                let new_col = (col + col_change + self.width)%self.width;
                let new_idx = self.get_index(new_row, new_col);
                count_alive += self.cells[new_idx] as u8;
            }
        }
        count_alive
    }
}

#[wasm_bindgen] // exposed to JavaScript, because it should be able to control when ticks happen
impl Universe {
    pub fn set_width(&mut self, width: i32){  // set width of the universe
        self.width = width;
        self.cells = (0..width * self.height)
        .map(|_i| Cell::Dead)
        .collect();
    }
    pub fn set_height(&mut self, height: i32){  // set height of the universe
        self.height = height;
        self.cells = (0..self.width * height)
        .map(|_i| Cell::Dead)
        .collect();
    }
    pub fn tick(&mut self){
        let mut next_state = self.cells.clone();
        for row in 0..self.height {
            for col in 0..self.width {
                let cnt = self.live_neighbor_count(row, col);
                let idx = self.get_index(row, col);
                let cell_state = self.cells[idx];
                let next_cell = match (cell_state, cnt) {
                    (Cell::Alive, x) if x<2 => Cell::Dead,
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    (Cell::Alive, x) if x>3 =>  Cell::Dead,
                    (Cell::Dead, 3) => Cell::Alive,
                    (otherwise, _) => otherwise,
                };
                next_state[idx] = next_cell;
            }
        }
        self.cells = next_state;
    }
    pub fn new() -> Universe {  // constructor to initialize the Universe 
        // utils::set_panic_hook();
        let width: i32 = 100;
        let height: i32 = 100;
        let limit: i32 = width * height;
        let random_bool = || rand::thread_rng().gen() ; // closure
        let cells = (0..limit)
            .map(|i| {
                if random_bool() {
                    Cell::Alive
                } else {
                    Cell::Dead
                }
            })
            .collect();
        Universe { width, height, cells}
    }
    pub fn render(&self) -> String {
        self.to_string()
    }
    pub fn width(&self) -> i32 {
        self.width
    }
    pub fn height(&self) -> i32 {
        self.height
    }
    pub fn cells(&self) -> *const Cell {  // const makes it a read only pointer to prevent modificatios from JavaScript side
        self.cells.as_ptr()
    }
    pub fn toggle_cell(&mut self, row: i32, col: i32) {
        let idx = self.get_index(row, col);
        self.cells[idx].toggle();
    }
    pub fn reset_universe(&mut self) {
        let width: i32 = 100;
        let height: i32 = 100;
        let limit: i32 = width * height;
        self.cells = (0..width * self.height)
        .map(|_i| Cell::Dead)
        .collect();
    }
}
impl Universe { // impl block that is not exposed to JS, and contains test functions
    pub fn get_cells(&self) -> &[Cell] {
        &self.cells
    }
    pub fn set_cells(&mut self, cells: &[(i32, i32)]) { // set cells as alive
        for i in cells.iter().cloned() {
            let idx = self.get_index(i.0, i.1);
            self.cells[idx] = Cell::Alive;
        }
    }
}

impl fmt::Display for Universe {  // implementing Display trait automatically implements String trait also, so to_string() can be used
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.cells.as_slice().chunks(self.width as usize) {
            for &cell in line {
                let symbol = match cell {
                    Cell::Dead => '◻',
                    Cell::Alive => '◼',
                };
                write!(f, "{}", symbol)?;
            }
            write!(f, "\n")?;
        }
        Ok(())
    }
}
