import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectID, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger()

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ){}

  async create(createProductDto: CreateProductDto) {

    try {
      const product = this.productRepository.create(createProductDto); //This only creates the entity from the dto. Doesn´t affect the db
      await this.productRepository.save(product)
      return product
      
    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

  async findAll(paginationDto: PaginationDto) {
    const {limit = 10, offset = 0} = paginationDto;
    return await this.productRepository.find({
      take: limit,
      skip: offset
    });
  }

  async findOne(searchTerm: string) {
    const product = await this.productRepository.findOneBy({id: searchTerm})
    console.log(product)
    if (!product){
      throw new NotFoundException(`Couldn't find any product with the id ${searchTerm}`)
    } 
    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(searchTerm: string) {
    const product = await this.findOne(searchTerm);
    if (product){
      await this.productRepository.delete({id: searchTerm})
    } 
  }

  private handleDBExceptions(error: any ){
    if (error.code === '23505')
        throw new BadRequestException(error.detail)
      this.logger.error(error)
      throw new InternalServerErrorException('Unexpected error, check server logs')
  }


}
